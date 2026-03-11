from __future__ import annotations

import mimetypes
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ruamel.yaml import YAML


PROJECT_DIR = Path(os.environ.get("MKDOCS_EDIT_PROJECT", os.getcwd())).resolve()
DOCS_DIR = PROJECT_DIR / "docs"
MKDOCS_CONFIG = PROJECT_DIR / "mkdocs.yml"
STATIC_DIR = Path(__file__).resolve().parent / "static"
DEFAULT_PREVIEW_URL = os.environ.get("MKDOCS_EDIT_PREVIEW_URL", "http://127.0.0.1:8000")

DOCS_DIR.mkdir(parents=True, exist_ok=True)

yaml = YAML()
yaml.preserve_quotes = True
yaml.indent(mapping=2, sequence=4, offset=2)

app = FastAPI(title="MkDocs Editor")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/assets", StaticFiles(directory=DOCS_DIR / "assets", check_dir=False), name="docs-assets")


class SavePageRequest(BaseModel):
    path: str
    content: str


class CreatePageRequest(BaseModel):
    path: str
    title: str | None = None


class DeletePageRequest(BaseModel):
    path: str


class RenamePageRequest(BaseModel):
    old_path: str
    new_path: str


class SaveNavRequest(BaseModel):
    nav: list[dict[str, Any]]


class SaveSettingsRequest(BaseModel):
    site_name: str | None = None
    upload: dict[str, Any] | None = None
    theme: dict[str, Any] | None = None


class SaveConfigRawRequest(BaseModel):
    content: str


DEFAULT_UPLOAD_TYPES = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".pdf",
    ".zip",
]

DEFAULT_UPLOAD_DIR = "assets/uploads"
WINDOWS_RESERVED_NAMES = {
    "con",
    "prn",
    "aux",
    "nul",
    "com1",
    "com2",
    "com3",
    "com4",
    "com5",
    "com6",
    "com7",
    "com8",
    "com9",
    "lpt1",
    "lpt2",
    "lpt3",
    "lpt4",
    "lpt5",
    "lpt6",
    "lpt7",
    "lpt8",
    "lpt9",
}


def safe_doc_path(relative_path: str) -> Path:
    cleaned = relative_path.strip().replace("\\", "/")
    if not cleaned:
        raise HTTPException(status_code=400, detail="Empty path is not allowed")

    rel = Path(cleaned)
    if rel.is_absolute() or ".." in rel.parts:
        raise HTTPException(status_code=400, detail="Invalid path")

    docs_root_abs = Path(os.path.abspath(DOCS_DIR))
    candidate_abs = Path(os.path.abspath(docs_root_abs / rel))
    if os.path.commonpath([str(docs_root_abs), str(candidate_abs)]) != str(docs_root_abs):
        raise HTTPException(status_code=400, detail="Invalid path")

    return candidate_abs


def ensure_project_layout() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    if not MKDOCS_CONFIG.exists():
        MKDOCS_CONFIG.write_text(
            "site_name: MkDocs Editor\n"
            "theme:\n"
            "  name: material\n"
            "nav:\n"
            "  - Home: index.md\n",
            encoding="utf-8",
        )
    index_page = DOCS_DIR / "index.md"
    if not index_page.exists():
        index_page.write_text("# Willkommen\n\nStarte mit deinem Inhalt.\n", encoding="utf-8")


def load_mkdocs_config() -> dict[str, Any]:
    ensure_project_layout()
    with MKDOCS_CONFIG.open("r", encoding="utf-8") as file:
        data = yaml.load(file) or {}
    if not isinstance(data, dict):
        raise HTTPException(status_code=500, detail="mkdocs.yml must contain a YAML mapping")
    return data


def get_upload_settings(config: dict[str, Any]) -> tuple[list[str], str]:
    editor_config = config.get("editor", {})
    if not isinstance(editor_config, dict):
        editor_config = {}

    upload_config = editor_config.get("upload", {})
    if not isinstance(upload_config, dict):
        upload_config = {}

    allowed_types = upload_config.get("allowed_types", DEFAULT_UPLOAD_TYPES)
    if not isinstance(allowed_types, list) or not allowed_types:
        allowed_types = DEFAULT_UPLOAD_TYPES

    normalized = []
    for file_type in allowed_types:
        if not isinstance(file_type, str):
            continue
        cleaned = file_type.strip().lower()
        if not cleaned:
            continue
        if not cleaned.startswith("."):
            cleaned = f".{cleaned}"
        normalized.append(cleaned)
    if not normalized:
        normalized = DEFAULT_UPLOAD_TYPES

    upload_dir = upload_config.get("dir", DEFAULT_UPLOAD_DIR)
    if not isinstance(upload_dir, str) or not upload_dir.strip():
        upload_dir = DEFAULT_UPLOAD_DIR

    return normalized, upload_dir.strip().strip("/")


def get_theme_tabs_enabled(config: dict[str, Any]) -> bool:
    return get_theme_feature_enabled(config, "navigation.tabs")


def get_theme_feature_enabled(config: dict[str, Any], feature_name: str) -> bool:
    theme = config.get("theme", {})
    if not isinstance(theme, dict):
        return False
    features = theme.get("features", [])
    if not isinstance(features, list):
        return False
    return feature_name in features


def get_theme_language(config: dict[str, Any]) -> str:
    theme = config.get("theme", {})
    if not isinstance(theme, dict):
        return ""
    language = theme.get("language", "")
    return language.strip() if isinstance(language, str) else ""


def get_theme_logo(config: dict[str, Any]) -> str:
    theme = config.get("theme", {})
    if not isinstance(theme, dict):
        return ""
    logo = theme.get("logo", "")
    return logo.strip() if isinstance(logo, str) else ""


def get_theme_logo_icon(config: dict[str, Any]) -> str:
    theme = config.get("theme", {})
    if not isinstance(theme, dict):
        return ""
    icon = theme.get("icon", {})
    if not isinstance(icon, dict):
        return ""
    logo_icon = icon.get("logo", "")
    return logo_icon.strip() if isinstance(logo_icon, str) else ""


def get_theme_palette(config: dict[str, Any]) -> dict[str, str]:
    theme = config.get("theme", {})
    if not isinstance(theme, dict):
        return {"scheme": "", "primary": "", "accent": ""}

    palette = theme.get("palette", {})
    if isinstance(palette, list):
        palette = palette[0] if palette else {}
    if not isinstance(palette, dict):
        palette = {}

    scheme = palette.get("scheme", "")
    primary = palette.get("primary", "")
    accent = palette.get("accent", "")
    return {
        "scheme": scheme.strip() if isinstance(scheme, str) else "",
        "primary": primary.strip() if isinstance(primary, str) else "",
        "accent": accent.strip() if isinstance(accent, str) else "",
    }


def apply_settings_to_config(config: dict[str, Any], request: SaveSettingsRequest) -> dict[str, Any]:
    if request.site_name is not None and request.site_name.strip():
        config["site_name"] = request.site_name.strip()

    editor_config = config.get("editor")
    if not isinstance(editor_config, dict):
        editor_config = {}

    upload_config = editor_config.get("upload")
    if not isinstance(upload_config, dict):
        upload_config = {}

    if request.upload is not None:
        upload_dir = request.upload.get("dir")
        if isinstance(upload_dir, str) and upload_dir.strip():
            upload_config["dir"] = upload_dir.strip().strip("/")

        allowed_types = request.upload.get("allowed_types")
        if isinstance(allowed_types, list) and allowed_types:
            normalized: list[str] = []
            for file_type in allowed_types:
                if not isinstance(file_type, str):
                    continue
                cleaned = file_type.strip().lower()
                if not cleaned:
                    continue
                if not cleaned.startswith("."):
                    cleaned = f".{cleaned}"
                normalized.append(cleaned)
            if normalized:
                upload_config["allowed_types"] = normalized

    if upload_config:
        editor_config["upload"] = upload_config
    if editor_config:
        config["editor"] = editor_config

    if request.theme is not None:
        theme = config.get("theme")
        if not isinstance(theme, dict):
            theme = {}

        features = theme.get("features")
        if not isinstance(features, list):
            features = []

        tabs_enabled = request.theme.get("navigation_tabs")
        if isinstance(tabs_enabled, bool):
            if tabs_enabled and "navigation.tabs" not in features:
                features.append("navigation.tabs")
            if not tabs_enabled:
                features = [feature for feature in features if feature != "navigation.tabs"]

        tabs_sticky = request.theme.get("navigation_tabs_sticky")
        if isinstance(tabs_sticky, bool):
            if tabs_sticky and "navigation.tabs.sticky" not in features:
                features.append("navigation.tabs.sticky")
            if not tabs_sticky:
                features = [feature for feature in features if feature != "navigation.tabs.sticky"]

        language = request.theme.get("language")
        if isinstance(language, str):
            cleaned_language = language.strip()
            if cleaned_language:
                theme["language"] = cleaned_language
            elif "language" in theme:
                del theme["language"]

        logo = request.theme.get("logo")
        if isinstance(logo, str):
            cleaned_logo = logo.strip()
            if cleaned_logo:
                theme["logo"] = cleaned_logo
            elif "logo" in theme:
                del theme["logo"]

        logo_icon = request.theme.get("logo_icon")
        if isinstance(logo_icon, str):
            icon = theme.get("icon")
            if not isinstance(icon, dict):
                icon = {}
            cleaned_logo_icon = logo_icon.strip()
            if cleaned_logo_icon:
                icon["logo"] = cleaned_logo_icon
            elif "logo" in icon:
                del icon["logo"]

            if icon:
                theme["icon"] = icon
            elif "icon" in theme:
                del theme["icon"]

        palette_request = request.theme.get("palette")
        if isinstance(palette_request, dict):
            palette: dict[str, str] = {}
            for key in ["scheme", "primary", "accent"]:
                value = palette_request.get(key)
                if isinstance(value, str) and value.strip():
                    palette[key] = value.strip()
            if palette:
                theme["palette"] = palette
            elif "palette" in theme:
                del theme["palette"]

        if features:
            theme["features"] = features
        elif "features" in theme:
            del theme["features"]

        config["theme"] = theme

    return config


def build_safe_upload_path(upload_dir: str, filename: str) -> Path:
    sanitized_name = sanitize_filename(filename)
    if not sanitized_name:
        raise HTTPException(status_code=400, detail="Invalid filename")

    target_dir = safe_doc_path(upload_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    candidate = target_dir / sanitized_name
    stem = candidate.stem
    suffix = candidate.suffix
    counter = 1
    while candidate.exists():
        candidate = target_dir / f"{stem}-{counter}{suffix}"
        counter += 1
    return candidate


def sanitize_filename(filename: str, max_stem_length: int = 80) -> str:
    base_name = Path(filename).name.strip()
    if not base_name:
        return ""

    raw_stem = Path(base_name).stem
    raw_suffix = Path(base_name).suffix.lower()

    normalized_stem = unicodedata.normalize("NFKD", raw_stem)
    ascii_stem = normalized_stem.encode("ascii", "ignore").decode("ascii")
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", ascii_stem)
    safe_stem = safe_stem.strip(" ._-")
    safe_stem = re.sub(r"-+", "-", safe_stem)

    if not safe_stem:
        safe_stem = "file"
    if safe_stem.lower() in WINDOWS_RESERVED_NAMES:
        safe_stem = f"{safe_stem}-file"
    if len(safe_stem) > max_stem_length:
        safe_stem = safe_stem[:max_stem_length].rstrip(" ._-") or "file"

    safe_suffix = re.sub(r"[^a-z0-9.]", "", raw_suffix)
    if safe_suffix and not safe_suffix.startswith("."):
        safe_suffix = f".{safe_suffix}"
    if safe_suffix == ".":
        safe_suffix = ""

    return f"{safe_stem}{safe_suffix}"


def convert_nav_item_to_node(item: Any) -> dict[str, Any]:
    if isinstance(item, dict) and len(item) == 1:
        title, value = next(iter(item.items()))
        if isinstance(value, list):
            return {
                "type": "group",
                "title": str(title),
                "children": [convert_nav_item_to_node(child) for child in value],
            }
        return {
            "type": "link",
            "title": str(title),
            "path": str(value),
        }
    if isinstance(item, str):
        return {
            "type": "link",
            "title": item,
            "path": item,
        }
    raise HTTPException(status_code=400, detail=f"Unsupported nav entry: {item}")


def convert_node_to_nav_item(node: dict[str, Any]) -> dict[str, Any]:
    node_type = node.get("type")
    title = (node.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Every nav item needs a title")

    if node_type == "group":
        children = node.get("children", [])
        if not isinstance(children, list):
            raise HTTPException(status_code=400, detail="Group children must be a list")
        return {title: [convert_node_to_nav_item(child) for child in children]}

    if node_type == "link":
        path = (node.get("path") or "").strip()
        if not path:
            raise HTTPException(status_code=400, detail=f"Link '{title}' has no path")
        return {title: path}

    raise HTTPException(status_code=400, detail="Unknown nav node type")


@app.get("/")
def index() -> FileResponse:
    ensure_project_layout()
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/nav")
def get_nav() -> dict[str, Any]:
    config = load_mkdocs_config()
    nav = config.get("nav", [])
    if not isinstance(nav, list):
        raise HTTPException(status_code=500, detail="mkdocs.yml nav must be a list")
    return {"nav": [convert_nav_item_to_node(item) for item in nav]}


@app.post("/api/nav")
def save_nav(request: SaveNavRequest) -> dict[str, str]:
    config = load_mkdocs_config()
    config["nav"] = [convert_node_to_nav_item(node) for node in request.nav]
    with MKDOCS_CONFIG.open("w", encoding="utf-8") as file:
        yaml.dump(config, file)
    return {"status": "ok"}


@app.get("/api/page")
def get_page(path: str) -> dict[str, str]:
    page = safe_doc_path(path)
    if not page.exists():
        raise HTTPException(status_code=404, detail="Page not found")
    return {"path": path, "content": page.read_text(encoding="utf-8")}


@app.get("/_docs/{file_path:path}")
def get_docs_asset(file_path: str) -> FileResponse:
    target = safe_doc_path(file_path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(target)


@app.post("/api/page")
def save_page(request: SavePageRequest) -> dict[str, str]:
    page = safe_doc_path(request.path)
    page.parent.mkdir(parents=True, exist_ok=True)
    page.write_text(request.content, encoding="utf-8")
    return {"status": "ok"}


@app.post("/api/page/create")
def create_page(request: CreatePageRequest) -> dict[str, str]:
    page = safe_doc_path(request.path)
    if page.exists():
        raise HTTPException(status_code=400, detail="Page already exists")
    page.parent.mkdir(parents=True, exist_ok=True)
    title = (request.title or "Neue Seite").strip() or "Neue Seite"
    page.write_text(f"# {title}\n\n", encoding="utf-8")
    return {"status": "ok"}


@app.post("/api/page/delete")
def delete_page(request: DeletePageRequest) -> dict[str, str]:
    page = safe_doc_path(request.path)
    if not page.exists():
        raise HTTPException(status_code=404, detail="Page not found")
    page.unlink()
    return {"status": "ok"}


@app.post("/api/page/rename")
def rename_page(request: RenamePageRequest) -> dict[str, str]:
    old_page = safe_doc_path(request.old_path)
    new_page = safe_doc_path(request.new_path)

    if not old_page.exists():
        raise HTTPException(status_code=404, detail="Source page not found")
    if new_page.exists():
        raise HTTPException(status_code=400, detail="Target page already exists")

    new_page.parent.mkdir(parents=True, exist_ok=True)
    old_page.rename(new_page)
    return {"status": "ok"}


@app.get("/api/files")
def list_markdown_files() -> dict[str, list[str]]:
    ensure_project_layout()
    files: list[str] = []
    for file in DOCS_DIR.rglob("*.md"):
        files.append(file.relative_to(DOCS_DIR).as_posix())
    files.sort()
    return {"files": files}


@app.get("/api/settings")
def get_editor_settings() -> dict[str, Any]:
    config = load_mkdocs_config()
    allowed_types, upload_dir = get_upload_settings(config)
    use_directory_urls = config.get("use_directory_urls", True)
    if not isinstance(use_directory_urls, bool):
        use_directory_urls = True
    return {
        "site_name": str(config.get("site_name", "")),
        "preview": {
            "url": DEFAULT_PREVIEW_URL,
            "use_directory_urls": use_directory_urls,
        },
        "upload": {
            "allowed_types": allowed_types,
            "dir": upload_dir,
        },
        "theme": {
            "navigation_tabs": get_theme_tabs_enabled(config),
            "navigation_tabs_sticky": get_theme_feature_enabled(config, "navigation.tabs.sticky"),
            "language": get_theme_language(config),
            "logo": get_theme_logo(config),
            "logo_icon": get_theme_logo_icon(config),
            "palette": get_theme_palette(config),
        }
    }


@app.post("/api/settings")
def save_editor_settings(request: SaveSettingsRequest) -> dict[str, str]:
    config = load_mkdocs_config()
    updated = apply_settings_to_config(config, request)
    with MKDOCS_CONFIG.open("w", encoding="utf-8") as file:
        yaml.dump(updated, file)
    return {"status": "ok"}


@app.get("/api/config/raw")
def get_raw_config() -> dict[str, str]:
    ensure_project_layout()
    return {"content": MKDOCS_CONFIG.read_text(encoding="utf-8")}


@app.post("/api/config/raw")
def save_raw_config(request: SaveConfigRawRequest) -> dict[str, str]:
    try:
        parsed = yaml.load(request.content)
    except Exception as error:  # pragma: no cover - validation branch
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {error}") from error

    if parsed is None:
        parsed = {}
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=400, detail="YAML root must be a mapping")

    MKDOCS_CONFIG.write_text(request.content, encoding="utf-8")
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    page_path: str = Form(""),
) -> dict[str, str]:
    config = load_mkdocs_config()
    allowed_types, upload_dir = get_upload_settings(config)

    filename = file.filename or ""
    extension = Path(filename).suffix.lower()
    if extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Filetype '{extension or 'unknown'}' is not allowed",
        )

    destination = build_safe_upload_path(upload_dir, filename)
    content = await file.read()
    destination.write_bytes(content)

    docs_relative = destination.relative_to(DOCS_DIR).as_posix()
    mime_type, _ = mimetypes.guess_type(destination.name)
    kind = "image" if mime_type and mime_type.startswith("image/") else "file"
    return {
        "path": docs_relative,
        "name": destination.name,
        "kind": kind,
        "page_path": page_path,
    }
