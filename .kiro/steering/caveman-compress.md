---
inclusion: manual
name: caveman-compress
description: Compress a natural-language memory file into caveman format to save input tokens.
---

# Caveman Compress

Compress a natural-language file (e.g. notes, todos, preferences) into caveman-speak to cut input tokens. No scripts or external tools — do it directly with file edits.

## Process

1. Confirm the target is a natural-language file (`.md`, `.txt`, extensionless). Never touch code or config: `.ts`, `.js`, `.json`, `.yaml`, `.yml`, `.toml`, `.env`, `.lock`, `.css`, `.html`, `.xml`, `.sql`, `.sh`.
2. If no backup exists, copy the original to `<filename>.original.md` first.
3. Apply the rules below and overwrite the original with the compressed version.

## Compression Rules

- Drop articles (a/an/the), filler, pleasantries, hedging.
- Preserve exactly: code blocks, inline code, URLs, file paths, commands, technical terms, proper nouns, dates, version numbers.
- Preserve structure: headings, bullet hierarchy, numbered lists, tables, frontmatter.
- Use short synonyms; fragments OK.
- Merge redundant bullets.
