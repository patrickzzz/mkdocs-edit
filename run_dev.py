from __future__ import annotations

import sys

from app.cli import run


if __name__ == "__main__":
    raise SystemExit(run(["--project", ".", "--reload", *sys.argv[1:]]))
