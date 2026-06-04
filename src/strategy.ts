import type {
  KeyRuntimeState,
  PublicKeyState,
  RouterStrategy,
  StoredKey,
  UsagePayload,
} from "./types"
import { maskSecret } from "./mask"

function createState(): KeyRuntimeState {
  return {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    totalTokens: 0,
    invalid: false,
  }
}

function cloneState(state: KeyRuntimeState): KeyRuntimeState {
  return { ...state }
}

export class KeyRouter {
  private readonly states = new Map<string, KeyRuntimeState>()
  private cursor = 0

  getState(id: string): KeyRuntimeState {
    const existing = this.states.get(id)
    if (existing) {
      return existing
    }

    const state = createState()
    this.states.set(id, state)
    return state
  }

  resetState(id: string): void {
    this.states.set(id, createState())
  }

  hydrate(keys: StoredKey[]): void {
    for (const key of keys) {
      if (key.metrics) {
        this.states.set(key.id, cloneState(key.metrics))
      }
    }
  }

  snapshot(id: string): KeyRuntimeState {
    return cloneState(this.getState(id))
  }

  selectKey(keys: StoredKey[], strategy: RouterStrategy): StoredKey | null {
    const now = Date.now()
    const candidates = keys.filter((key) => {
      const state = this.getState(key.id)
      return key.enabled && !state.invalid && (!state.cooldownUntil || state.cooldownUntil <= now)
    })

    if (candidates.length === 0) {
      return null
    }

    if (strategy === "least-used") {
      return [...candidates].sort((a, b) => {
        const aState = this.getState(a.id)
        const bState = this.getState(b.id)
        return aState.requestCount - bState.requestCount
      })[0] ?? null
    }

    if (strategy === "healthy-first") {
      const noError = candidates.find((key) => this.getState(key.id).errorCount === 0)
      if (noError) {
        return noError
      }
    }

    const selected = candidates[this.cursor % candidates.length] ?? null
    this.cursor = (this.cursor + 1) % Number.MAX_SAFE_INTEGER
    return selected
  }

  recordStart(key: StoredKey): void {
    const state = this.getState(key.id)
    state.requestCount += 1
    state.lastUsedAt = new Date().toISOString()
  }

  recordSuccess(key: StoredKey, status: number, usage?: UsagePayload): void {
    const state = this.getState(key.id)
    state.successCount += 1
    state.lastStatus = status
    state.lastError = undefined

    if (usage) {
      state.inputTokens += usage.prompt_tokens ?? 0
      state.outputTokens += usage.completion_tokens ?? 0
      state.totalTokens += usage.total_tokens ?? 0
      state.cachedTokens += usage.prompt_tokens_details?.cached_tokens ?? 0
    }
  }

  recordFailure(key: StoredKey, status: number, message: string, cooldownMs: number): void {
    const state = this.getState(key.id)
    state.errorCount += 1
    state.lastStatus = status
    state.lastError = message

    if (status === 401 || status === 403) {
      state.invalid = true
    }
    if (status === 429) {
      state.cooldownUntil = Date.now() + cooldownMs
    }
  }

  listPublicStates(keys: StoredKey[]): PublicKeyState[] {
    const now = Date.now()
    return keys.map((key) => {
      const state = this.getState(key.id)
      const status = !key.enabled
        ? "disabled"
        : state.invalid
          ? "invalid"
          : state.cooldownUntil && state.cooldownUntil > now
            ? "cooldown"
            : "active"

      return {
        id: key.id,
        name: key.name,
        maskedKey: maskSecret(key.key),
        enabled: key.enabled,
        createdAt: key.createdAt,
        status,
        requestCount: state.requestCount,
        successCount: state.successCount,
        errorCount: state.errorCount,
        inputTokens: state.inputTokens,
        outputTokens: state.outputTokens,
        cachedTokens: state.cachedTokens,
        totalTokens: state.totalTokens,
        lastStatus: state.lastStatus,
        lastError: state.lastError,
        lastUsedAt: state.lastUsedAt,
        cooldownUntil: state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : undefined,
      }
    })
  }
}
