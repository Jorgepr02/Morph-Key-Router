#!/usr/bin/env bun

import { KeyStore } from "./keyStore"
import { MorphKeyRouterServer } from "./router"

interface CliOptions {
  host: string
  port: number
}

function printHelp(): void {
  console.log(`Usage:
  morph-key-router web [--host 127.0.0.1] [--port 3478]

Environment:
  MORPH_ROUTER_API_KEYS      Comma-separated Morph API keys to seed the router
  MORPH_ROUTER_CONFIG        Config file path
  MORPH_ROUTER_TARGET_URL    Morph API target URL, defaults to https://api.morphllm.com
  MORPH_ROUTER_COOLDOWN_MS   Cooldown after 429, defaults to 60000
  MORPH_ROUTER_STRATEGY      round-robin, least-used, or healthy-first`)
}

function parsePort(value: string | undefined): number {
  const port = Number.parseInt(value || "3478", 10)
  return Number.isFinite(port) && port > 0 ? port : 3478
}

function parseArgs(args: string[]): CliOptions | null {
  const command = args[0]
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp()
    return null
  }

  if (command !== "web") {
    console.error(`Unknown command: ${command}`)
    printHelp()
    process.exitCode = 1
    return null
  }

  let host = process.env.MORPH_ROUTER_HOST || "127.0.0.1"
  let port = parsePort(process.env.MORPH_ROUTER_PORT)

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index]
    const next = args[index + 1]

    if (arg === "--host" && next) {
      host = next
      index += 1
      continue
    }

    if (arg === "--port" && next) {
      port = parsePort(next)
      index += 1
      continue
    }

    console.error(`Unknown or incomplete option: ${arg}`)
    printHelp()
    process.exitCode = 1
    return null
  }

  return { host, port }
}

const options = parseArgs(process.argv.slice(2))
if (options) {
  const server = new MorphKeyRouterServer(new KeyStore(), options)
  await server.start()

  console.log(`[morph-key-router] listening on ${server.url}`)
  console.log(`[morph-key-router] dashboard: ${server.url}/dashboard`)
  console.log(`[morph-key-router] proxy: set MORPH_API_URL=${server.url}`)

  const stop = (): void => {
    server.stop()
    process.exit(0)
  }

  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)

  await new Promise(() => {})
}
