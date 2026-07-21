# Development Setup

## Supported Environment

Windows is the supported production environment. The repository has build commands for macOS and Linux, but the invoice PDF workflow depends on the bundled Windows `wkhtmltopdf.exe` path and those platforms require independent validation before being treated as supported.

## Prerequisites

- Git.
- Node.js and npm compatible with the lockfile and the installed Electron toolchain.
- Python available on `PATH` for the PythonShell-launched scripts.
- Permission to install Python packages for the first dependency check.
- A sanitized set of input workbooks for testing.
- Windows permissions to write to the selected output folder.

The repository does not contain a Python requirements file. `scripts/dependency-check.py` imports the required packages and installs missing packages with `pip`:

- `pdfkit`
- `jinja2`
- `pandas`
- `openpyxl`
- `xlsxwriter`
- `xlrd`

The dependency checker runs from the application UI during startup. It installs packages into the Python environment used by PythonShell. Confirm that this is an approved environment before using a production machine.

## Install

From the repository root:

```bash
npm install
```

The `postinstall` script runs `electron-builder install-app-deps`.

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Electron and the Vite development renderer |
| `npm run start` | Preview the built application |
| `npm run typecheck` | Run node and web TypeScript checks |
| `npm run typecheck:node` | Check main, preload, and Electron configuration types |
| `npm run typecheck:web` | Check renderer and preload declaration types |
| `npm run lint` | Run ESLint with automatic fixes |
| `npm run format` | Format repository files with Prettier |
| `npm run build` | Typecheck and build the Electron application |
| `npm run build:unpack` | Build and create an unpacked Electron distribution |
| `npm run build:win` | Build the Windows installer |
| `npm run build:mac` | Build the macOS package |
| `npm run build:linux` | Build Linux packages |

## Debugging

The repository includes VS Code configurations in `.vscode/launch.json`:

- `Debug Main Process` launches Electron Vite with source maps.
- `Debug Renderer Process` attaches to the renderer on port `9222`.
- `Debug All` launches both configurations.

For a renderer issue, inspect the browser console and the React state in `src/renderer/src/App.tsx`. For a script issue, inspect the Electron main-process console and the UI log. Python stderr is collected by the main process and forwarded through the relevant error event.

## Project Map

```text
src/main/index.ts                 Electron main process
src/preload/index.ts              Context bridge
src/preload/index.d.ts            Window type declarations
src/renderer/src/App.tsx          Main React workflow UI
src/renderer/src/components/      Reusable UI components
src/renderer/src/assets/          CSS, fonts, and renderer assets
scripts/main.py                   Invoice and credit-note workflow
scripts/mail-agenda-generation.py Email-agenda workflow
scripts/main_template/            Jinja2 invoice HTML template
scripts/resources/                Logos and static Python resources
scripts/wkhtmltopdf/              PDF conversion binaries
resources/                        Electron application icon/resources
build/                            Electron-builder icons and entitlements
```

## Change Validation

At minimum, run:

```bash
npm run typecheck
npm run lint
npm run build
```

For changes affecting data processing, also run the sanitized smoke test described in [11-maintenance-reference.md](11-maintenance-reference.md). Do not use production workbooks as test fixtures.

## Source-Control Rules

Do not commit:

- Client or bank workbooks.
- Email recipient lists or pending-invoice files.
- Generated PDFs, CSVs, or Excel reports.
- Credentials or environment files.
- Local absolute paths.
- Unsanitized logs containing customer or financial data.

The current `.gitignore` excludes `node_modules`, `dist`, `out`, logs, `.env`, and Python cache files. It does not automatically exclude arbitrary Excel, CSV, or PDF files, so verify `git status` before committing.
