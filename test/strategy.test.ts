import { describe, expect, test } from "bun:test"

import { KeyRouter } from "../src/strategy"
import type { StoredKey } from "../src/types"

const keys: StoredKey[] = [
  { id: "a", name: "A", key: "sk-a", enabled: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "b", name: "B", key: "sk-b", enabled: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "c", name: "C", key: "sk-c", enabled: true, createdAt: "2026-01-01T00:00:00.000Z" },
]

describe("KeyRouter", () => {
  test("rotates keys with round-robin", () => {
    const router = new KeyRouter()

    expect(router.selectKey(keys, "round-robin")?.id).toBe("a")
    expect(router.selectKey(keys, "round-robin")?.id).toBe("b")
    expect(router.selectKey(keys, "round-robin")?.id).toBe("c")
    expect(router.selectKey(keys, "round-robin")?.id).toBe("a")
  })

  test("skips disabled and invalid keys", () => {
    const router = new KeyRouter()
    router.recordFailure(keys[0]!, 401, "invalid", 60_000)

    expect(router.selectKey([{ ...keys[1]!, enabled: false }, keys[0]!, keys[2]!], "round-robin")?.id)
      .toBe("c")
  })

  test("least-used selects the key with fewer observed requests", () => {
    const router = new KeyRouter()
    router.recordStart(keys[0]!)
    router.recordStart(keys[0]!)
    router.recordStart(keys[1]!)

    expect(router.selectKey(keys, "least-used")?.id).toBe("c")
  })
})
