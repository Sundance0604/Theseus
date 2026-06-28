# Ship of Theseus — Visual Persona Interface

> The planks may change; continuity lives in remembered conversation.

## Product concept

Ship of Theseus is a local-first visual interface for a collection of
user-defined AI personas. React and Pixi.js provide the game-like stage; a
loopback-only Node runtime loads persona metadata, maintains isolated sessions
and invokes Claude Code in the user's private persona workspace.

This public repository intentionally contains no persona names, biographies,
prompts, relationships, portraits or memories.

## Visual language

The interface uses a high-contrast red, black and warm-white palette with
angled panels, heavy outlines, halftone textures and animated scene
transitions. Each locally configured persona may provide an emoji, color and
portrait path through its private Markdown frontmatter.

## Planned scenes

1. **Ship Panorama** — launch screen and navigation.
2. **Dialogue** — one-to-one streamed conversation.
3. **Seminar Room** — ordered multi-persona discussion.
4. **Archive** — shared discussion history.
5. **Memory Ward** — isolated per-persona memory viewer.
6. **Captain's Cabin** — user-owned planning dashboard.
7. **Settings** — local workspace and runtime configuration.

Only the launch, navigation and one-to-one dialogue flows are currently
implemented.

## Runtime boundary

```text
React / Pixi presentation
          │ HTTP + SSE on loopback
          ▼
Local Node runtime
          │
          ├── private persona workspace
          ├── local transcripts
          └── Claude Code → user-configured model provider
```

The browser receives only the metadata needed for rendering. Provider
credentials remain in the local runtime process. Persona discovery is dynamic:
every non-underscored Markdown file directly under `personas/` is treated as a
persona.

## Repository boundary

Public:

- rendering code;
- generic runtime and parser;
- configuration templates;
- non-personal visual assets.

Private and external:

- persona Markdown and prompt patches;
- portraits and expression variants;
- memories, seminar notes and transcripts;
- provider credentials;
- local absolute paths.
