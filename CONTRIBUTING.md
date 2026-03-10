# Contributing

Thanks for contributing.

## Local Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 -m pip install -r requirements-dev.txt
npm install
```

## Run

```bash
python3 run_dev.py
```

## Tests

```bash
pytest
node --check app/static/app.js
```

Optional E2E:

```bash
npx playwright install
npm run test:e2e
```

## Pull Requests

- Keep changes focused and small.
- Update README/docs when behavior changes.
- Add or adjust tests for non-trivial behavior.
- Do not commit generated artifacts.
