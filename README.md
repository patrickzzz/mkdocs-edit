# MkDocsEdit

A local content editor for MkDocs projects with live preview, navigation editing, uploads, and project settings.

## Demo

Add your usage GIF here:

```md
![MkDocs Editor Demo](./docs/demo.gif)
```

## Features

- Toast UI Markdown editor
- Navigation tree editor (nested drag and drop)
- Link types: internal pages and external URLs
- File/image uploads with allowed-type config
- Settings dialog for common MkDocs/Material options
- Raw `mkdocs.yml` edit mode
- Live preview via `mkdocs serve`
- Keyboard save shortcut (`Ctrl+S` / `Cmd+S`)

## Installation

### Option A: Python (recommended)

Install once with `pipx`:

```bash
pipx install git+ssh://git@github.com/patrickzzz/mkdocs-edit.git
```

Or from local source:

```bash
pipx install .
```

### Option B: Docker

Build once:

```bash
docker build -t mkdocs-edit:local .
```

Run for your current docs project:

```bash
docker run --rm -it -p 9000:9000 -p 8000:8000 -v "$PWD:/workspace" mkdocs-edit:local
```

## Usage In Any Docs Folder

In your MkDocs project directory (clean `docs/` + `mkdocs.yml`):

```bash
mkdocs-edit --project .
```

With custom ports:

```bash
mkdocs-edit --project . --editor-port 9100 --mkdocs-port 8100
```

Open:

- Editor: `http://127.0.0.1:<editor-port>`
- Preview: `http://127.0.0.1:<mkdocs-port>`

## Environment Variables

You can configure defaults via env vars:

- `MKDOCS_EDIT_PROJECT`
- `MKDOCS_EDIT_HOST`
- `MKDOCS_EDIT_PORT`
- `MKDOCS_SERVE_HOST`
- `MKDOCS_SERVE_PORT`

CLI flags override env vars.

## Local Development

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 run_dev.py
```

## Tests

Backend:

```bash
python3 -m pip install -r requirements-dev.txt
pytest
```

Frontend syntax check:

```bash
node --check app/static/app.js
```

Optional E2E:

```bash
npm install
npx playwright install
npm run test:e2e
```

## Settings (Form Mode)

Managed keys include:

- `site_name`
- `theme.features` (`navigation.tabs`)
- `theme.features` (`navigation.tabs`, `navigation.tabs.sticky`)
- `theme.language`
- `theme.logo`
- `theme.icon.logo`
- `theme.palette.scheme`
- `theme.palette.primary`
- `theme.palette.accent`
- `editor.upload.dir`
- `editor.upload.allowed_types`

## Upload Configuration

Example in `mkdocs.yml`:

```yaml
editor:
  upload:
    dir: assets/uploads
    allowed_types:
      - .png
      - .jpg
      - .jpeg
      - .webp
      - .svg
      - .pdf
```

## Material Top Tabs

Top-level navigation tabs in Material are controlled by `navigation.tabs`:

```yaml
theme:
  name: material
  features:
    - navigation.tabs
    - navigation.tabs.sticky
```

Note: `navigation.tabs*`, `theme.palette`, and `theme.icon.logo` are Material-focused settings.

## License

This project is licensed under the MIT License. See `LICENSE`.

Third-party dependency licenses are listed in `THIRD_PARTY_LICENSES.md`.
