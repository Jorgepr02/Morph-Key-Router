import { chmod, mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"

import type { KeyRuntimeState, RouterConfig, RouterStrategy, StoredKey } from "./types"

const DEFAULT_TARGET_URL = "https://api.morphllm.com"
const DEFAULT_COOLDOWN_MS = 60_000

function getHomeDirectory(): string {
  return process.env.HOME || process.env.USERPROFILE || "."
}

export function getDefaultConfigPath(): string {
  return process.env.MORPH_ROUTER_CONFIG ||
    join(getHomeDirectory(), ".config", "morph-key-router", "config.json")
}

function parseStrategy(value: string | undefined): RouterStrategy {
  if (value === "least-used" || value === "healthy-first") {
    return value
  }

  return "round-robin"
}

function parseEnvKeys(): StoredKey[] {
  const keys = process.env.MORPH_ROUTER_API_KEYS
    ?.split(",")
    .map((key) => key.trim())
    .filter(Boolean) ?? []

  return keys.map((key, index) => ({
    id: `env-${index + 1}`,
    name: `env-key-${index + 1}`,
    key,
    enabled: true,
    createdAt: new Date().toISOString(),
  }))
}

function createDefaultConfig(): RouterConfig {
  return {
    keys: parseEnvKeys(),
    strategy: parseStrategy(process.env.MORPH_ROUTER_STRATEGY),
    cooldownMs: Number.parseInt(process.env.MORPH_ROUTER_COOLDOWN_MS || "", 10) ||
      DEFAULT_COOLDOWN_MS,
    targetUrl: process.env.MORPH_ROUTER_TARGET_URL || DEFAULT_TARGET_URL,
  }
}

function normalizeConfig(value: unknown): RouterConfig {
  const fallback = createDefaultConfig()
  if (!value || typeof value !== "object") {
    return fallback
  }

  const config = value as Partial<RouterConfig>
  const keys = Array.isArray(config.keys) ? config.keys.filter(isStoredKey) : fallback.keys

  return {
    keys,
    strategy: parseStrategy(config.strategy),
    cooldownMs: typeof config.cooldownMs === "number" && config.cooldownMs > 0
      ? config.cooldownMs
      : fallback.cooldownMs,
    targetUrl: typeof config.targetUrl === "string" && config.targetUrl.trim()
      ? config.targetUrl.replace(/\/$/, "")
      : fallback.targetUrl,
  }
}

function isStoredKey(value: unknown): value is StoredKey {
  if (!value || typeof value !== "object") {
    return false
  }

  const key = value as Partial<StoredKey>
  return typeof key.id === "string" &&
    typeof key.name === "string" &&
    typeof key.key === "string" &&
    typeof key.enabled === "boolean" &&
    typeof key.createdAt === "string"
}

function cloneMetrics(metrics: KeyRuntimeState): KeyRuntimeState {
  return { ...metrics }
}

export class KeyStore {
  private config: RouterConfig = createDefaultConfig()

  constructor(private readonly configPath = getDefaultConfigPath()) {}

  get path(): string {
    return this.configPath
  }

  getConfig(): RouterConfig {
    return this.config
  }

  async load(): Promise<RouterConfig> {
    const file = Bun.file(this.configPath)
    if (await file.exists()) {
      const text = await file.text()
      this.config = normalizeConfig(JSON.parse(text) as unknown)
      return this.config
    }

    this.config = createDefaultConfig()
    await this.save()
    return this.config
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.configPath), { recursive: true })
    await Bun.write(this.configPath, `${JSON.stringify(this.config, null, 2)}\n`)
    await chmod(this.configPath, 0o600)
  }

  async addKey(name: string, key: string): Promise<StoredKey> {
    const storedKey: StoredKey = {
      id: crypto.randomUUID(),
      name: name.trim() || `key-${this.config.keys.length + 1}`,
      key: key.trim(),
      enabled: true,
      createdAt: new Date().toISOString(),
    }

    this.config.keys.push(storedKey)
    await this.save()
    return storedKey
  }

  async updateKey(
    id: string,
    patch: Partial<Pick<StoredKey, "name" | "key" | "enabled">>
  ): Promise<StoredKey | null> {
    const key = this.config.keys.find((item) => item.id === id)
    if (!key) {
      return null
    }

    if (typeof patch.name === "string") {
      key.name = patch.name.trim() || key.name
    }
    if (typeof patch.key === "string" && patch.key.trim()) {
      key.key = patch.key.trim()
    }
    if (typeof patch.enabled === "boolean") {
      key.enabled = patch.enabled
    }

    await this.save()
    return key
  }

  async deleteKey(id: string): Promise<boolean> {
    const initialLength = this.config.keys.length
    this.config.keys = this.config.keys.filter((key) => key.id !== id)
    const deleted = this.config.keys.length !== initialLength
    if (deleted) {
      await this.save()
    }

    return deleted
  }

  async updateMetrics(id: string, metrics: KeyRuntimeState): Promise<void> {
    const key = this.config.keys.find((item) => item.id === id)
    if (!key) {
      return
    }

    key.metrics = cloneMetrics(metrics)
    await this.save()
  }

  async updateSettings(settings: {
    strategy?: RouterStrategy
    cooldownMs?: number
    targetUrl?: string
  }): Promise<RouterConfig> {
    if (settings.strategy) {
      this.config.strategy = settings.strategy
    }
    if (typeof settings.cooldownMs === "number" && settings.cooldownMs > 0) {
      this.config.cooldownMs = settings.cooldownMs
    }
    if (typeof settings.targetUrl === "string" && settings.targetUrl.trim()) {
      this.config.targetUrl = settings.targetUrl.trim().replace(/\/$/, "")
    }

    await this.save()
    return this.config
  }
}
