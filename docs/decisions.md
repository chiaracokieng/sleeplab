# Decisions

## Product

## Architecture

* 2026-04-17: **Keep architecture documentation in CLAUDE.md, no separate architecture.md**. Reason: CLAUDE.md already covers architecture, file structure, data model, and key decisions. A separate file would duplicate content and drift out of sync.

## Engineering

* 2026-04-11: **Use Airtable instead of Google Sheets for storing data**. Reason: Airtable's API is very simple, whereas Google Sheets's is moderately complex. For my first vibe coding project, I want to spend less time fighting auth and more time building the actual app.
