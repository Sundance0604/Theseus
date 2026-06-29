# Private persona workspace checklist

> Copy this file into your private persona workspace, rename it if desired,
> replace every placeholder, and never commit the completed copy to this public
> repository.

## Workspace

- [ ] Private workspace path: `<absolute-local-path>`
- [ ] `CLAUDE.md` contains the routing and memory rules.
- [ ] `personas/` contains one Markdown file per persona.
- [ ] The workspace is private or excluded from Git.
- [ ] API keys are stored in environment variables or an OS credential store.

These two localized keys are read by the application. Keep the labels unchanged
and replace only the values:

```markdown
- 用户头像：`photo/<private-user-portrait>.png`
- 研讨会主持人：`<persona-id>`
```

## Persona inventory

Repeat this section for each persona:

### `<persona-id>`

- Markdown: `personas/<persona-id>.md`
- Display name: `<private-display-name>`
- Trigger: `@<private-trigger>`
- Role/domain: `<private-role>`
- Emoji: `<emoji>`
- Theme color: `<#RRGGBB>`
- Theme color name: `<optional-localized-color-name>`
- Default portrait: `<relative-private-image-path>`
- Half-body portrait: place `<display-name>.<extension>` under the adjacent
  `half/` directory; the default portrait filename is accepted as a fallback.
- Expression variants: `<relative-private-directory-or-none>`
- Private memory directory: `personas/memories/<persona-id>/`
- Prompt patch: `<relative-path-or-none>`
- Shared seminar access: `<yes-or-no>`

Recommended frontmatter:

```yaml
---
name: "<private-display-name>"
role: "<private-role>"
gender: "<optional>"
age: "<optional>"
style: "<private-speaking-style>"
reference: "<optional-private-reference>"
trigger: "@<private-trigger>"
greeting: "<private-greeting>"
emoji: "◆"
color: "#D40000"
avatar: "assets/<persona-id>/default.webp"
---
```

The file body should contain the full private persona prompt. The public
application reads only frontmatter fields needed for rendering; Claude Code
loads the full file inside the private workspace.

## Portrait checklist

- [ ] Images contain no unwanted EXIF/GPS metadata.
- [ ] Filenames do not contain a real name or account identifier.
- [ ] Portraits are licensed for the intended use.
- [ ] Private portraits are not copied into this public repository.
- [ ] Every interaction portrait is stored inside the adjacent `half/`
  directory and follows the display-name naming convention.
- [ ] Paths in frontmatter are relative to the private workspace.

## Memory checklist

- [ ] Each persona can access only its intended memory directory.
- [ ] Conversation summaries contain no credentials or unnecessary identifiers.
- [ ] Raw transcripts are excluded from Git.
- [ ] Shared seminar notes are reviewed before syncing.
- [ ] Backups use encryption appropriate to their sensitivity.

## Pre-publication check

Before publishing application code, search for:

```text
persona names
private triggers
biographical traits
portrait filenames
absolute paths
usernames and email addresses
API keys and tokens
conversation excerpts
memory summaries
```
