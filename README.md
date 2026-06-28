# Ship of Theseus

A local-first, game-styled interface for interacting with user-owned AI
personas.

The React/Pixi client is a presentation layer. Persona definitions, memories,
conversation records and provider credentials stay in a local persona
workspace selected by the user. No persona names, prompts or portraits are
included in this repository.

## Quick start

1. Install Node.js and Claude Code.
2. Copy [PERSONA_SETUP.template.md](PERSONA_SETUP.template.md) into your private
   persona workspace and complete the checklist.
3. Set `THESEUS_PERSONA_HOME` to that private workspace.
4. Configure your model provider in the same terminal.
5. Run:

```powershell
npm install
npm run dev
```

Vite starts the loopback-only runtime automatically. The browser never receives
the provider API key and cannot read the persona workspace directly.

## Privacy model

- Keep the persona workspace outside this repository.
- Never commit persona Markdown, portraits, memories, transcripts or API keys.
- The selected remote model provider receives conversation content and any
  persona context required to answer.
- Local transcripts are stored under `bridge-server/data/` and ignored by Git.
- Claude Code is launched without shell or network tools by this application.

See [LOCAL_AI_SETUP.md](LOCAL_AI_SETUP.md) for configuration details.
