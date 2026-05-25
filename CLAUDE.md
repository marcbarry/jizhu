# Repository Notes

## Encoding

- Treat all deck JSON, Markdown docs, and JSX files as UTF-8.
- Chinese text, pinyin tone marks, box-drawing separators, bullets, and middle dots are expected in this repo. Do not interpret PowerShell mojibake such as `ä½ `, `â€”`, `â”€`, or `Â·` as file corruption unless a byte/UTF-8-aware check confirms those literal sequences are present in the file.
- Prefer `rg`/`git diff` for content checks. If PowerShell display looks corrupted, verify by reading the file as UTF-8 or by checking `git diff --ignore-cr-at-eol --ignore-space-at-eol` before making encoding-related edits.
- Do not run broad line-ending or encoding normalization across the repo. Make targeted patches only.
