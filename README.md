# Ship of Theseus

A local-first React/Pixi interface for user-owned AI personas. It provides
single-persona conversations and an isolated multi-persona War Room while
keeping persona definitions, portraits, memories and transcripts outside the
frontend source tree.

## Quick start

Requirements: Node.js, Claude Code, and a private persona workspace.

```powershell
npm install
$env:THESEUS_PERSONA_HOME = "X:\path\to\private-persona-workspace"
npm run dev
```

`npm run dev` starts both Vite and a loopback-only bridge to Claude Code.
Configure the model provider in the same terminal before starting. Never put
provider credentials in `VITE_*` variables because those may be exposed to the
browser.

Use [PERSONA_SETUP.template.md](PERSONA_SETUP.template.md) to prepare the
private workspace. Detailed provider and directory instructions are in
[LOCAL_AI_SETUP.md](LOCAL_AI_SETUP.md).

## Privacy

- Persona Markdown, portraits and memories remain in the user-selected local
  workspace.
- Conversation records stay under ignored local runtime directories.
- API keys remain in process environment variables or private Claude settings.
- The configured remote model provider still receives prompts and relevant
  persona context when generating a response.
- Web tools remain disabled. Shell commands are available only after the user
  approves the exact request in the visual interaction screen.

No persona prompts, names, portraits, credentials or conversation records are
included in this repository.

## License

GPL-3.0. See [LICENSE](LICENSE).
