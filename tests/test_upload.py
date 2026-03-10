from pathlib import Path

from fastapi.testclient import TestClient

import app.main as main


def configure_tmp_project(monkeypatch, tmp_path, allowed_types=None):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)

    allowed = allowed_types or [".png", ".jpg", ".pdf"]
    mkdocs_config = tmp_path / "mkdocs.yml"
    mkdocs_config.write_text(
        "site_name: Test\n"
        "editor:\n"
        "  upload:\n"
        "    dir: assets/uploads\n"
        "    allowed_types:\n"
        + "".join(f"      - {entry}\n" for entry in allowed),
        encoding="utf-8",
    )

    monkeypatch.setattr(main, "DOCS_DIR", docs_dir)
    monkeypatch.setattr(main, "MKDOCS_CONFIG", mkdocs_config)


def test_sanitize_filename_handles_special_chars():
    value = main.sanitize_filename(" ..M y Bil d??.JPÉG ")
    assert value == "M-y-Bil-d.jpg"


def test_upload_rejects_disallowed_extension(monkeypatch, tmp_path):
    configure_tmp_project(monkeypatch, tmp_path, allowed_types=[".pdf"])
    client = TestClient(main.app)

    response = client.post(
        "/api/upload",
        files={"file": ("photo.png", b"pngdata", "image/png")},
        data={"page_path": "index.md"},
    )

    assert response.status_code == 400
    assert "not allowed" in response.text


def test_upload_sanitizes_and_deduplicates_filename(monkeypatch, tmp_path):
    configure_tmp_project(monkeypatch, tmp_path)
    client = TestClient(main.app)

    payload = {"file": ("fancy uber file.PDF", b"123", "application/pdf")}
    first = client.post("/api/upload", files=payload, data={"page_path": "index.md"})
    second = client.post("/api/upload", files=payload, data={"page_path": "index.md"})

    assert first.status_code == 200
    assert second.status_code == 200

    first_path = first.json()["path"]
    second_path = second.json()["path"]

    assert first_path == "assets/uploads/fancy-uber-file.pdf"
    assert second_path == "assets/uploads/fancy-uber-file-1.pdf"
    assert (Path(main.DOCS_DIR) / first_path).exists()
    assert (Path(main.DOCS_DIR) / second_path).exists()
