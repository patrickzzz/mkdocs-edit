from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
from pathlib import Path


def ensure_project_layout(project_dir: Path) -> None:
    docs_dir = project_dir / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)

    mkdocs_config = project_dir / "mkdocs.yml"
    if not mkdocs_config.exists():
        mkdocs_config.write_text(
            "site_name: MkDocs\n"
            "theme:\n"
            "  name: material\n"
            "nav:\n"
            "  - Home: index.md\n",
            encoding="utf-8",
        )

    index_page = docs_dir / "index.md"
    if not index_page.exists():
        index_page.write_text("# Welcome\n\nStart writing your docs here.\n", encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run mkdocs-edit for a target project")
    parser.add_argument(
        "--project",
        default=os.environ.get("MKDOCS_EDIT_PROJECT", "."),
        help="Path to the MkDocs project (default: current directory)",
    )
    parser.add_argument(
        "--editor-host",
        default=os.environ.get("MKDOCS_EDIT_HOST", "127.0.0.1"),
        help="Host for the editor API/UI server",
    )
    parser.add_argument(
        "--editor-port",
        type=int,
        default=int(os.environ.get("MKDOCS_EDIT_PORT", "9000")),
        help="Port for the editor API/UI server",
    )
    parser.add_argument(
        "--mkdocs-host",
        default=os.environ.get("MKDOCS_SERVE_HOST", "127.0.0.1"),
        help="Host for mkdocs serve",
    )
    parser.add_argument(
        "--mkdocs-port",
        type=int,
        default=int(os.environ.get("MKDOCS_SERVE_PORT", "8000")),
        help="Port for mkdocs serve",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for the editor backend",
    )
    parser.add_argument(
        "--no-mkdocs",
        action="store_true",
        help="Start only the editor server without mkdocs serve",
    )
    return parser.parse_args(argv)


def spawn(command: list[str], *, env: dict[str, str], cwd: Path) -> subprocess.Popen[bytes]:
    return subprocess.Popen(command, cwd=str(cwd), env=env)


def run(argv: list[str]) -> int:
    args = parse_args(argv)
    project_dir = Path(args.project).resolve()
    ensure_project_layout(project_dir)

    env = os.environ.copy()
    env["MKDOCS_EDIT_PROJECT"] = str(project_dir)
    preview_host = args.mkdocs_host if args.mkdocs_host not in {"0.0.0.0", "::"} else "127.0.0.1"
    env["MKDOCS_EDIT_PREVIEW_URL"] = f"http://{preview_host}:{args.mkdocs_port}"

    children: list[subprocess.Popen[bytes]] = []
    if not args.no_mkdocs:
        children.append(
            spawn(
                [
                    "mkdocs",
                    "serve",
                    "--dev-addr",
                    f"{args.mkdocs_host}:{args.mkdocs_port}",
                ],
                env=env,
                cwd=project_dir,
            )
        )

    uvicorn_command = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        args.editor_host,
        "--port",
        str(args.editor_port),
    ]
    if args.reload:
        uvicorn_command.append("--reload")

    children.append(spawn(uvicorn_command, env=env, cwd=project_dir))

    def shutdown(*_: object) -> None:
        for proc in children:
            if proc.poll() is None:
                proc.terminate()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            for proc in children:
                code = proc.poll()
                if code is not None:
                    shutdown()
                    return code
    except KeyboardInterrupt:
        shutdown()
        return 0


def main() -> int:
    return run(sys.argv[1:])


if __name__ == "__main__":
    raise SystemExit(main())
