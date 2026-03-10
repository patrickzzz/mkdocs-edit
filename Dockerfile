FROM python:3.11-slim

WORKDIR /opt/mkdocs-edit

COPY pyproject.toml README.md LICENSE ./
COPY app ./app

RUN pip install --no-cache-dir .

WORKDIR /workspace
EXPOSE 9000 8000

ENTRYPOINT ["mkdocs-edit"]
CMD ["--project", "/workspace", "--editor-host", "0.0.0.0", "--mkdocs-host", "0.0.0.0"]
