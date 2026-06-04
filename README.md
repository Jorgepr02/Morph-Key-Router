# morph-key-router

Tiny local router for Morph API keys.

I made this for the case where you use Morph Fast Apply in OpenCode but have more than one
Morph key. Instead of changing that plugin, point it at this local proxy and let the router pick
which key to use.

Repo: https://github.com/Jorgepr02/Morph-Key-Router

```text
OpenCode
  -> @f97/opencode-morph-fast-apply
  -> http://127.0.0.1:3478/v1/chat/completions
  -> morph-key-router
  -> https://api.morphllm.com/v1/chat/completions
```

## What It Does

- Rotates keys with `round-robin`, `least-used`, or `healthy-first`.
- Gives you a local dashboard at `http://127.0.0.1:3478/dashboard`.
- Lets you add, disable, enable, and delete keys from the browser.
- Tracks the usage Morph returns in `response.usage`.
- Keeps per-key counters for requests, successes, errors, tokens, and status.
- Puts a key on cooldown after `429`.
- Marks a key invalid after `401` or `403`.
- Stores config locally with `0600` permissions.
- Masks keys in logs and in the dashboard.

## Install

From npm:

```bash
npm install -g morph-key-router
```

If you are working from a local checkout:

```bash
npm install
npm install -g .
```

This runs as a normal CLI. You do not need to add it to `opencode.json`.

## OpenCode Setup

Keep Morph Fast Apply in your OpenCode config:

```json
{
  "plugin": ["@f97/opencode-morph-fast-apply"]
}
```

Then point Morph Fast Apply at the local router:

```bash
export MORPH_API_URL="http://127.0.0.1:3478"
export MORPH_API_KEY="dummy-router-key"
```

`MORPH_API_KEY` still needs some value because Morph Fast Apply expects one. The router replaces
it with the real key before forwarding the request.

Restart OpenCode after changing those env vars.

## Run It

```bash
morph-key-router web --host 127.0.0.1 --port 3478
```

Open the dashboard:

```text
http://127.0.0.1:3478/dashboard
```

Add at least one Morph key there, then requests sent to `MORPH_API_URL` will go through the
router.

## Quick Check

After adding a key, send a tiny OpenAI-compatible request through the proxy:

```bash
curl http://127.0.0.1:3478/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer dummy' \
  -d '{"model":"morph-v3-fast","messages":[{"role":"user","content":"Reply with ok"}],"temperature":0}'
```

Refresh the dashboard. You should see the counters move. With more than one active key, the
default `round-robin` strategy should rotate between them.

## Environment Variables

| Variable | Default | What it does |
| --- | --- | --- |
| `MORPH_ROUTER_PORT` | `3478` | Local HTTP port. |
| `MORPH_ROUTER_HOST` | `127.0.0.1` | Bind host. Keep this local unless you add your own auth in front. |
| `MORPH_ROUTER_CONFIG` | `~/.config/morph-key-router/config.json` | Config file path. |
| `MORPH_ROUTER_API_KEYS` | empty | Optional comma-separated keys to seed the router. The dashboard is usually easier. |
| `MORPH_ROUTER_STRATEGY` | `round-robin` | `round-robin`, `least-used`, or `healthy-first`. |
| `MORPH_ROUTER_COOLDOWN_MS` | `60000` | How long a key rests after a `429`. |
| `MORPH_ROUTER_TARGET_URL` | `https://api.morphllm.com` | Upstream Morph API URL. |

## A Couple Of Limits

The router only knows about requests that pass through it. If you use the same key somewhere else,
that usage will not show up in the dashboard.

It also does not call a Morph account usage endpoint. It just records the `usage` values Morph
includes in responses.

## Security

- The dashboard binds to `127.0.0.1` by default.
- Keys are stored in the local config file.
- The config file is written with `0600` permissions.
- The dashboard only shows masked keys.
- Do not bind this to `0.0.0.0` unless you put authentication in front of it.

## Development

```bash
npm install
npm run typecheck
npm test
```

## License

MIT.
