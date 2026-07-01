# Ship of Theseus

A local-first React/Pixi interface for user-owned AI personas. The browser is
only a presentation layer; `bridge-server/server.js` owns persona context,
conversation state, local files, and model-provider access.

## Quick Start

Requirements: Node.js, Claude Code, and a private persona workspace.

```powershell
npm install
Copy-Item .\persona_path.template.json .\persona_path.json
notepad .\persona_path.json
npm run dev
```

`persona_path.json` is the single local path configuration file. It is ignored
by git and should sit in the project root during development. For the packaged
Electron app, place `persona_path.json` next to the installed `.exe`.

## Electron Desktop App

A packaged Windows `.exe` is produced by `npm run electron:build` and output to
`release-electron/`.  The executable bundles the Vite frontend, bridge server,
and Electron shell into a single installable application.

Requirements for the packaged app:
- Place `persona_path.json` next to the installed `.exe`, or set
  `THESEUS_CONFIG_FILE` to its full path.
- The exe does **not** inherit shell environment variables (`.bashrc`, etc.).
  Configure model credentials directly in `persona_path.json` → `claude.env`
  (see below).

## CLAUDE Environment Variables

When using a DeepSeek-compatible endpoint or a custom model provider, set the
following fields in `persona_path.json` → `claude.env`:

| Field | Purpose |
|-------|---------|
| `ANTHROPIC_BASE_URL` | API base URL (e.g. `https://api.deepseek.com/anthropic`) |
| `ANTHROPIC_AUTH_TOKEN` | Authentication token (DeepSeek API key) |
| `ANTHROPIC_MODEL` | Default model name |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Opus-tier model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Sonnet-tier model |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Haiku-tier (flash) model |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Sub-agent model for complex tasks |
| `CLAUDE_CODE_EFFORT_LEVEL` | Effort level (e.g. `"max"`) |

To clear an inherited native Anthropic key, set `"ANTHROPIC_API_KEY": ""`
explicitly.

> **Why this matters:** An exe launched from Windows Explorer does not run Bash
> or read `.bashrc`.  If your Claude Code normally picks up environment
> variables from a shell startup file, you must copy those same values into
> `persona_path.json` for the packaged Electron app to work.

## External Path Configuration

`persona_path.json` contains every local external link:

```json
{
  "personaHome": "X:\\path\\to\\private-persona-workspace",
  "personaProfile": "PERSONA_SETUP.private.md",
  "memoryPaths": {
    "definition": "personas/{personaId}.md",
    "conversations": "personas/memories/{personaId}/",
    "meetings": "personas/seminar/"
  },
  "engine": {
    "claudeJson": "C:\\Users\\<your-user>\\.claude.json",
    "projectsDir": "C:\\Users\\<your-user>\\.claude\\projects",
    "numStartupsField": "numStartups"
  },
  "claude": {
    "executable": "",
    "env": {
      "ANTHROPIC_BASE_URL": "",
      "ANTHROPIC_AUTH_TOKEN": "",
      "ANTHROPIC_API_KEY": "",
      "ANTHROPIC_MODEL": "",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "",
      "CLAUDE_CODE_SUBAGENT_MODEL": "",
      "CLAUDE_CODE_EFFORT_LEVEL": ""
    }
  }
}
```

- `personaHome`: private persona workspace root.
- `personaProfile`: profile file inside `personaHome`, used for portraits,
  theme colors, facilitator, and user avatar.
- `memoryPaths`: relative paths inside `personaHome`; `{personaId}` is replaced
  with the selected persona id.
- `engine`: local Claude Code statistics sources for Engine Room.
- `claude`: optional desktop runtime config. Leave `executable` empty to
  auto-detect Claude Code for the current Windows user. Set `env` when the
  packaged exe cannot inherit provider variables, such as a DeepSeek-compatible
  endpoint, token, and model mappings. Explicit empty strings are preserved, so
  `"ANTHROPIC_API_KEY": ""` clears an inherited native Anthropic key.

Variables exported from `~/.bashrc` are available only to programs launched by
that Bash session. An exe started from Windows Explorer does not run Bash or
read `.bashrc`; put the same Claude variables in the exe-side
`persona_path.json`, then restart the app.

Environment variables still override selected fields when needed:
`THESEUS_CONFIG_FILE`, `THESEUS_PERSONA_HOME`, `AI_PERSONA_HOME`,
`THESEUS_ENGINE_CLAUDE_JSON`, `THESEUS_ENGINE_PROJECTS_DIR`, and
`THESEUS_DATA_DIR`. `CLAUDE_EXECUTABLE` overrides `claude.executable`.

## Assets In Packaged Builds

Built-in images such as `public/Yuri.png`, `public/memory.png`, and
`public/ship.png` are bundled by Vite into `dist`. They do not belong in
`persona_path.json`. The app resolves them through Vite's base URL so both
`npm run dev` and packaged `file://` Electron builds can load them.

External persona portraits are different: they remain in `personaHome` and are
served by the local bridge through `/persona-asset`, `/persona-half`,
`/user-avatar`, and `/user-half`.

## Roadmap & Known Issues

### 1. Session Sync Between Web & Desktop
**Problem:** Web dev (`DATA_DIR` defaults to `bridge-server/data/conversations`)
and packaged Electron (`THESEUS_DATA_DIR` defaults to `%APPDATA%/…/data/conversations`)
write session JSON to different locations. Conversations started in the browser
are invisible to the desktop app, and vice versa.

**Fix:** Add a `dataDir` field to `persona_path.json` so both runtimes can point
to the same shared directory. The bridge server already reads
`THESEUS_DATA_DIR`; the remaining step is to let `persona_path.json` override
it explicitly:
```json
{ "dataDir": "D:\\Shared\\theseus-data\\conversations" }
```
Priority: `THESEUS_DATA_DIR` env → `persona_path.json` → built-in default.

### 2. Single Conversation Context Per Persona
**Problem:** `loadTranscript(personaId)` always resolves to ONE file
(`data/conversations/{personaId}.json`). There is no concept of multiple
sessions per persona — every new chat overwrites or appends to the same
transcript. The UI has no session switcher.

**Fix:** Restructure to session-scoped paths:
```
data/conversations/{personaId}/{sessionId}.json
```
Add a `GET /sessions?personaId=` endpoint that lists available session IDs.
Extend `POST /chat` and `GET /history` to accept an optional `?sessionId=`
query parameter. On the frontend, add a session dropdown or tab bar inside the
persona interaction overlay so users can create, switch, and delete sessions.

### 3. Sequential Rebuttal Instead of Parallel
**Problem:** Socrates' rebuttal is generated sequentially within the same
`streamClaude()` call — it is one long response that happens to contain
counter-arguments. A true adversarial review requires a **separate, concurrent**
API call so the rebuttal arrives in real time alongside the main answer.

**Fix:** Add a `POST /rebuttal` endpoint that launches a second Claude query
in parallel with the main chat stream. The rebuttal stream sends a distinct SSE
event type (`event: rebuttal-chunk`) so the frontend can render it in a
dedicated panel (e.g., a red-bordered inset box). Both streams share the same
`AbortController`. A dedicated API key field (`ANTHROPIC_REBUTTAL_AUTH_TOKEN`)
allows the rebuttal to use a different model or provider without interfering
with the primary conversation.

### 4. Static Half-Body Portrait Selection
**Problem:** `halfPortraitPath()` picks the first matching file in
`personas/{id}/half/`. The same portrait is shown every time, regardless of
context or interaction type.

**Fix:** Change the server to return **all** available half-body portraits
(`GET /persona-half` → array of URLs). The frontend randomly picks one variant
on each interaction (`personas/{id}/half/{name}-1.png`, `-2.png`, …). This
makes character expressions feel dynamic without any AI-side changes.

### 5. Anarchy Background Turns Blue at 100%
**Problem:** `GameBackground.jsx` line 50 hard-codes `partReplacement === 100
? 0x1A237E` — a dark blue (`#1A237E`). When the conversation reaches 100%
"parts replaced," the iconic red anarchism skew block abruptly turns blue.

**Fix:** Remove the special-cased 100% branch. Always use the active persona
color:
```js
const blockColor = hexToPixi(activeColorRef.current);
```
If a visual cue for completion is desired, fade the block to pure black
(`0x1A1A1A`) over the last 20% using a lerp, keeping within the red-black
palette.

### 6. Captain's Cabin — Social Data Aggregation
**Problem:** Captain's Cabin is a placeholder with no implementation. The vision
is a personal dashboard aggregating activity from social platforms.

**Proposed design:**
- Add a `social` section to `persona_path.json` for OAuth tokens and API
  credentials (GitHub PAT, Twitter API key, etc.).
- Bridge server exposes `GET /social/github` and `GET /social/twitter` that
  proxy to the respective APIs, keeping tokens server-side.
- Captain's Cabin UI renders a dashboard: GitHub contribution grid, recent
  tweets, Claude Code session stats (reusing Engine Room data).
- Optional: read local JSON exports as an offline-first fallback.

### 7. Hardcoded Seminar Facilitator Message
**Problem:** When Lin facilitates a multi-persona seminar, the opening "system
status briefing" is generated by Lin's Claude prompt. The format and scope of
this briefing cannot be changed without editing Lin's persona definition, and
the facilitator role is tied to Lin specifically.

**Fix:** Extract the seminar briefing template to a configurable file
(`personas/seminar/briefing-template.md` or referenced from `persona_path.json`
→ `seminarBriefingTemplate`). Before starting a seminar, the frontend fetches
this template and lets the user edit it. The `POST /seminar/start` endpoint
accepts an optional `briefingTemplate` field. The facilitator persona (not
hard-coded to Lin) reads this template and fills in the dynamic system state
(archive count, git status, etc.).

### 8. Web Search Unavailable in Packaged Electron
**Problem:** In the packaged `.exe`, the bridge server's Claude Code child
process runs inside Electron's `sandbox: true` + `contextIsolation: true`
environment. The `WebFetch` and `WebSearch` tools were originally
`disallowedTools`. Even when enabled in `allowedTools`, the Electron sandbox
prevents the Node child process from making arbitrary outbound HTTP requests
to non-API endpoints (Google/Bing search result pages). In web dev mode
(`npm run dev`), this works because the bridge runs as a standalone Node
process with full network access.

**Fix:** Add a dedicated proxy endpoint `POST /web-search` in the bridge
server. The frontend calls this endpoint instead of letting Claude Code
directly invoke `WebSearch`. The bridge server uses a server-side HTTP client
(no sandbox restrictions) to fetch search results, sanitizes them, and returns
them to Claude Code as tool output. This keeps persona context off the public
web while restoring search functionality in Electron builds.

### 9. server.js Monolith Needs Refactoring
**Problem:** `bridge-server/server.js` has grown to **1538 lines** containing
49 top-level functions interleaved with route handlers, persona parsing,
transcript I/O, seminar management, interaction polling, Claude Code SDK
integration, file serving, and SSE streaming — all in a single file. There is
no separation between the HTTP layer, business logic, and data access. Adding
a new feature requires navigating the entire file.

**Fix — Proposed Module Split:**

```
bridge-server/
├── server.js                 # ~150 lines: HTTP server + route dispatch only
├── routes/
│   ├── chat.js               # POST /chat, SSE streaming, interaction hooks
│   ├── personas.js           # GET /personas, /persona-asset, /persona-half
│   ├── history.js            # GET|DELETE /history, transcript I/O
│   ├── seminar.js            # /seminar/*, multi-agent orchestration
│   ├── archive.js            # /archive/*, /memory/*, markdown file serving
│   ├── profile.js            # GET /profile, /user-avatar, /user-half
│   └── web-search.js         # POST /web-search (new — see issue 8)
├── lib/
│   ├── config.js             # localConfig, PERSONA_HOME, DATA_DIR, paths
│   ├── personas.js           # readPersona, readAllPersonas, publicPersona
│   ├── transcripts.js        # load/saveTranscript, transcriptPath
│   ├── seminars.js           # create/load/saveSeminar, seminarPath
│   ├── archives.js           # archiveFiles, archiveFileId, markdown helpers
│   ├── sse.js                # sseWrite, stream helpers
│   └── claude.js             # claudeExecutable, runtimeEnv, query wrapper
└── middleware/
    └── cors.js               # CORS + loopback-only guard
```

Each route module exports a `(req, res) => Promise<void>` handler. `server.js`
acts as a thin dispatcher: parse URL → delegate to route module. This removes
~1100 lines from the entry point and makes each concern independently testable.

## Documentation

- [Persona setup template](doc/PERSONA_SETUP.template.md)
- [Local AI setup](doc/LOCAL_AI_SETUP.md)
- [P5R control style guide](doc/P5R-CONTROL-STYLE-GUIDE.md)
- [Visual interface notes](doc/Ship%20of%20Theseus.md)

## Privacy

- Persona Markdown, portraits, and memories remain in the configured private
  workspace.
- Conversation records stay under ignored local runtime directories.
- API keys remain in process environment variables, private Claude settings, or
  the ignored local `persona_path.json` used beside the packaged exe.
- Never put provider credentials in `VITE_*` variables because those are
  exposed to the browser.

No persona prompts, names, portraits, credentials, or conversation records are
included in this repository.

## License

GPL-3.0. See [LICENSE](LICENSE).
