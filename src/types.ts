export type RouterStrategy = "round-robin" | "least-used" | "healthy-first"

export interface StoredKey {
  id: string
  name: string
  key: string
  enabled: boolean
  createdAt: string
  metrics?: KeyRuntimeState
}

export interface RouterConfig {
  keys: StoredKey[]
  strategy: RouterStrategy
  cooldownMs: number
  targetUrl: string
}

export interface KeyRuntimeState {
  requestCount: number
  successCount: number
  errorCount: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  totalTokens: number
  lastStatus?: number
  lastError?: string
  lastUsedAt?: string
  cooldownUntil?: number
  invalid: boolean
}

export interface PublicKeyState {
  id: string
  name: string
  maskedKey: string
  enabled: boolean
  createdAt: string
  status: "active" | "disabled" | "cooldown" | "invalid"
  requestCount: number
  successCount: number
  errorCount: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  totalTokens: number
  lastStatus?: number
  lastError?: string
  lastUsedAt?: string
  cooldownUntil?: string
}

export interface UsagePayload {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: {
    cached_tokens?: number
  }
}
