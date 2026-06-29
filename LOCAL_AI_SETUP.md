# Local AI setup

The application requires a private persona workspace outside this repository.
The browser is only a presentation client; Vite starts the loopback runtime
inside the same `npm run dev` process.

## 1. Prepare the private workspace

Use any local directory and create:

```text
<persona-home>/
├── CLAUDE.md
├── photo/
│   ├── <portrait>.png
│   └── half/
│       └── <portrait>.png
└── personas/
    ├── <persona-id>.md
    ├── memories/
    └── seminar/
```

Complete [PERSONA_SETUP.template.md](PERSONA_SETUP.template.md) inside that
private directory. Do not copy the completed file back into this repository.

## 2. Select the workspace

PowerShell:

```powershell
$env:THESEUS_PERSONA_HOME = "X:\path\to\private-persona-workspace"
```

Bash:

```bash
export THESEUS_PERSONA_HOME="/path/to/private-persona-workspace"
```

`AI_PERSONA_HOME` remains supported as a backwards-compatible variable.

## 3. Configure the model provider

Configure Claude Code using your provider's supported environment variables or
settings. Keep all credentials outside Vite variables: anything prefixed with
`VITE_` can be exposed to browser code.

Example placeholders:

```powershell
$env:ANTHROPIC_BASE_URL = "https://your-provider.example/anthropic"
$env:ANTHROPIC_AUTH_TOKEN = "REPLACE_ME"
$env:ANTHROPIC_API_KEY = ""
$env:ANTHROPIC_MODEL = "YOUR_MODEL_NAME"
```

No provider credential is stored by this project.

## 4. Start

```powershell
npm install
npm run dev
```

`npm run local-ai` is available for diagnostics but is not required during
normal development.

## Interactive approvals

The bridge uses the Claude Agent SDK permission callback. Read/search tools run
normally, file edits follow Claude Code's `acceptEdits` behavior, and shell
commands pause the current turn until the user allows or rejects the exact
request in the browser. Web tools remain disabled.

While an approval or `AskUserQuestion` prompt is open, regular chat input is
locked. The same Claude session continues after the user responds.

For the P5R-style interaction screen, place each half-body portrait in a
`half/` directory beside the configured portrait. Persona portraits are looked
up by display name first, then by the default portrait filename:

```text
photo/example.png
photo/half/<persona-display-name>.png
```

## Local data ownership

- Persona definitions and curated memories: private persona workspace.
- Exact UI transcripts and Claude session IDs:
  `bridge-server/data/conversations/*.json`.
- Provider credentials: process environment or private Claude Code settings.

Each persona receives a separate Claude Code session and transcript. Clearing
a UI conversation creates a new session without deleting curated memory files.
