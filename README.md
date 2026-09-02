# pi-claude-cli

> **This is a maintained fork** of [rchern/pi-claude-cli](https://github.com/rchern/pi-claude-cli).
> Published 0.3.1 has two defects that both fail silently: the entire system prompt is
> discarded, and the resume prompt drops your question whenever an extension appends a message
> after it — which is what pi's plan mode does, so plan mode answers nothing at all. Both are
> fixed here, with tests, and offered upstream. Install a tagged release rather than `main`:
>
> ```
> pi install git:github.com/VincenzoImp/pi-claude-cli@v0.3.1-pi-agent.1
> ```
>
> Everything below is the upstream README, unchanged.

A [pi](https://github.com/mariozechner/pi-coding-agent) extension that routes LLM calls through the [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) as a subprocess. Use your Claude Pro/Max subscription as the LLM backend — no API key, no separate billing.

## How it works

The extension registers as a custom pi provider exposing all Claude models. Each request spawns a `claude -p` subprocess using the stream-json wire protocol, with `--resume` on follow-up turns to reuse the CLI's session state instead of replaying full history. Claude proposes tool calls, pi executes them natively. Custom pi tools are exposed to Claude via a schema-only MCP server.

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (`claude` on PATH)
- A Claude Pro or Max subscription
- [pi](https://github.com/mariozechner/pi-coding-agent) or [GSD](https://github.com/gsd-build/gsd-2)

## Installation

Add to `~/.gsd/agent/settings.json`:

```json
{
  "packages": ["npm:pi-claude-cli"]
}
```

Then select a Claude model via `/model` in the interactive UI. All Claude models appear under the `pi-claude-cli` provider.

## Features

- Streams text, thinking, and tool call tokens in real-time
- Maps tool names and arguments bidirectionally between Claude and pi
- Exposes custom pi tools to Claude via MCP (schema-only, no execution)
- Break-early pattern prevents Claude CLI from auto-executing tools
- Session resume via `--resume` eliminates history replay on follow-up turns
- Configurable thinking effort with elevated budgets for Opus models
- Cross-platform subprocess management (Windows, macOS, Linux)
- Inactivity timeout and process registry for cleanup

## License

MIT
