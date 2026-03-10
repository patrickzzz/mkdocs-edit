# Release Checklist

Use this checklist before publishing a new version.

## 1) Preflight

- [ ] Working tree is clean (no unintended files)
- [ ] `python3 -m compileall app` passes
- [ ] `node --check app/static/app.js` passes
- [ ] `pytest -q` passes
- [ ] README is up to date (screenshots/GIF/commands)
- [ ] `THIRD_PARTY_LICENSES.md` reflects current dependencies

## 2) Versioning

Suggested scheme: Semantic Versioning (`MAJOR.MINOR.PATCH`)

- `PATCH`: bug fixes only
- `MINOR`: new features, backward compatible
- `MAJOR`: breaking changes

## 3) Changelog

- [ ] Add a new section in `CHANGELOG.md`
- [ ] Summarize user-visible changes
- [ ] Mention breaking changes explicitly

## 4) Git Tag + GitHub Release

Example for `v0.1.0`:

```bash
git add .
git commit -m "prepare release v0.1.0"
git tag v0.1.0
git push origin <branch>
git push origin v0.1.0
```

Then create a GitHub release from tag `v0.1.0` and paste changelog notes.

## 5) Post-release smoke check

- [ ] Fresh clone starts with documented commands
- [ ] Editor UI loads on `:9000`
- [ ] MkDocs preview loads on `:8000`
- [ ] Save, nav edit, upload, settings still work
