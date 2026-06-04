import type { Server } from "bun"

import { renderDashboard } from "./dashboard"
import { KeyStore } from "./keyStore"
import { KeyRouter } from "./strategy"
import type { RouterStrategy, UsagePayload } from "./types"

interface RouterOptions {
  port: number
  host: string
}

interface JsonError {
  error: string
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

function isStrategy(value: unknown): value is RouterStrategy {
  return value === "round-robin" || value === "least-used" || value === "healthy-first"
}

function extractUsage(value: unknown): UsagePayload | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const maybeUsage = (value as { usage?: UsagePayload }).usage
  return maybeUsage && typeof maybeUsage === "object" ? maybeUsage : undefined
}

function getHeaderObject(request: Request, apiKey: string): Headers {
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")
  headers.set("accept-encoding", "identity")
  headers.set("authorization", `Bearer ${apiKey}`)
  return headers
}

function toClientResponse(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.delete("content-encoding")
  headers.delete("content-length")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export class MorphKeyRouterServer {
  private readonly router = new KeyRouter()
  private server?: Server<unknown>

  constructor(
    private readonly store: KeyStore,
    private readonly options: RouterOptions
  ) {}

  get url(): string {
    return `http://${this.options.host}:${this.options.port}`
  }

  async start(): Promise<void> {
    const config = await this.store.load()
    this.router.hydrate(config.keys)
    this.server = Bun.serve({
      hostname: this.options.host,
      port: this.options.port,
      fetch: (request) => this.handle(request),
    })
  }

  stop(): void {
    this.server?.stop(true)
  }

  private async handle(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/" || url.pathname === "/dashboard") {
      return new Response(renderDashboard(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      return this.getStatus()
    }

    if (url.pathname === "/api/keys" && request.method === "POST") {
      return this.addKey(request)
    }

    if (url.pathname.startsWith("/api/keys/") && request.method === "PATCH") {
      return this.updateKey(request, url.pathname.split("/").at(-1) || "")
    }

    if (url.pathname.startsWith("/api/keys/") && request.method === "DELETE") {
      return this.deleteKey(url.pathname.split("/").at(-1) || "")
    }

    if (url.pathname === "/api/config" && request.method === "PATCH") {
      return this.updateConfig(request)
    }

    if (url.pathname.startsWith("/v1/")) {
      return this.proxy(request, url)
    }

    return json({ error: "Not found" } satisfies JsonError, 404)
  }

  private getStatus(): Response {
    const config = this.store.getConfig()
    return json({
      proxyUrl: this.url,
      config: {
        strategy: config.strategy,
        cooldownMs: config.cooldownMs,
        targetUrl: config.targetUrl,
        configPath: this.store.path,
      },
      keys: this.router.listPublicStates(config.keys),
    })
  }

  private async addKey(request: Request): Promise<Response> {
    const body = await readJson<{ name?: string; key?: string }>(request)
    if (!body?.key?.trim()) {
      return json({ error: "key is required" } satisfies JsonError, 400)
    }

    const key = await this.store.addKey(body.name || "", body.key)
    this.router.resetState(key.id)
    return json({ ok: true })
  }

  private async updateKey(request: Request, id: string): Promise<Response> {
    const body = await readJson<{ name?: string; key?: string; enabled?: boolean }>(request)
    if (!body) {
      return json({ error: "Invalid JSON body" } satisfies JsonError, 400)
    }

    const key = await this.store.updateKey(id, body)
    if (!key) {
      return json({ error: "Key not found" } satisfies JsonError, 404)
    }

    if (body.key || body.enabled === true) {
      this.router.resetState(id)
    }

    return json({ ok: true })
  }

  private async deleteKey(id: string): Promise<Response> {
    const deleted = await this.store.deleteKey(id)
    return deleted ? json({ ok: true }) : json({ error: "Key not found" } satisfies JsonError, 404)
  }

  private async updateConfig(request: Request): Promise<Response> {
    const body = await readJson<{
      strategy?: unknown
      cooldownMs?: unknown
      targetUrl?: unknown
    }>(request)

    if (!body) {
      return json({ error: "Invalid JSON body" } satisfies JsonError, 400)
    }

    const strategy = isStrategy(body.strategy) ? body.strategy : undefined
    const cooldownMs = typeof body.cooldownMs === "number" ? body.cooldownMs : undefined
    const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl : undefined

    await this.store.updateSettings({ strategy, cooldownMs, targetUrl })
    return json({ ok: true })
  }

  private async proxy(request: Request, url: URL): Promise<Response> {
    const config = this.store.getConfig()
    const selectedKey = this.router.selectKey(config.keys, config.strategy)
    if (!selectedKey) {
      return json({ error: "No healthy Morph API keys available" } satisfies JsonError, 503)
    }

    this.router.recordStart(selectedKey)
    await this.persistMetrics(selectedKey.id)
    const target = `${config.targetUrl}${url.pathname}${url.search}`

    try {
      const response = await fetch(target, {
        method: request.method,
        headers: getHeaderObject(request, selectedKey.key),
        body: request.body,
      })

      await this.recordResponse(selectedKey, response, config.cooldownMs)
      await this.persistMetrics(selectedKey.id)
      return toClientResponse(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed"
      this.router.recordFailure(selectedKey, 0, message, config.cooldownMs)
      await this.persistMetrics(selectedKey.id)
      return json({ error: message } satisfies JsonError, 502)
    }
  }

  private async persistMetrics(keyId: string): Promise<void> {
    await this.store.updateMetrics(keyId, this.router.snapshot(keyId))
  }

  private async recordResponse(
    selectedKey: { id: string; name: string; key: string; enabled: boolean; createdAt: string },
    response: Response,
    cooldownMs: number
  ): Promise<void> {
    if (!response.ok) {
      const message = response.statusText || `HTTP ${response.status}`
      this.router.recordFailure(selectedKey, response.status, message, cooldownMs)
      return
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      this.router.recordSuccess(selectedKey, response.status)
      return
    }

    try {
      const data = (await response.clone().json()) as unknown
      this.router.recordSuccess(selectedKey, response.status, extractUsage(data))
    } catch {
      this.router.recordSuccess(selectedKey, response.status)
    }
  }
}
