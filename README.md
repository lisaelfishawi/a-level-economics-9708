# A Level Economics 9708 — personal study hub

A dark, fast, offline-friendly study site for **Cambridge International AS & A Level Economics (9708)**: every chapter summarised in full, key terms, exam tips, diagrams to know, and hand-picked YouTube videos. Search, dark/dim themes, and per-chapter progress are all built in.

## How to use it

- **Live site:** open the GitHub Pages URL on any device.
- **Locally:** it loads content over HTTP, so don't just double-click `index.html` (browsers block `file://` fetches). Instead run a tiny local server from this folder:
  ```bash
  python3 -m http.server 8000
  ```
  then open <http://localhost:8000>.
- Press <kbd>/</kbd> to jump to search. Click **Mark as done** on a chapter to track progress (saved in your browser). Use the bottom-left button to switch **Dim / Dark**.

## Where to drop the coursebook

Put the Cambridge coursebook **PDF in this folder**. It's used to align the chapter list to the book's real chapters; content is cross-checked against the official 9708 syllabus.

## Structure

```
index.html              app shell
assets/styles.css       dark fiery theme
assets/app.js           nav, search, progress, theme, routing
assets/marked.min.js    Markdown renderer (vendored)
content/manifest.json   units + chapter list (drives nav & search)
content/<id>.json       one file per chapter (summary, terms, tips, diagrams, videos)
```

To add/edit a chapter: create/update `content/<id>.json` and make sure it's listed in `content/manifest.json`. Remove `"stub": true` once a chapter is written.

## Updating notes & videos

This is a static site, so it doesn't update itself. When you want fresh notes, better videos, or to reflect a syllabus change, open a **Claude Code** session in this folder and say **“update the econ site.”** Claude re-checks the syllabus, finds better/newer material, rewrites what changed, and pushes it live to GitHub Pages.
