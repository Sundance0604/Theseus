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
