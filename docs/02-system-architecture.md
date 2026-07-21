# System Architecture

## Layers

| Layer | Main files | Responsibility |
| --- | --- | --- |
| Electron main process | `src/main/index.ts` | Creates the window, opens dialogs, starts Python, and forwards events |
| Preload | `src/preload/index.ts`, `src/preload/index.d.ts` | Exposes Electron APIs to the renderer through the context bridge |
| React renderer | `src/renderer/src/App.tsx` | Collects paths and settings, controls the UI, and displays progress/errors |
| Python invoice workflow | `scripts/main.py` | Reads workbooks, renders HTML, creates PDFs, and writes accountability data |
| Python email workflow | `scripts/mail-agenda-generation.py` | Reads invoice and pending data, prepares email rows, and writes Excel reports |
| Python helper scripts | `scripts/initial-clients.py`, `scripts/dependency-check.py` | Loads client options and checks Python package availability |
| Invoice template | `scripts/main_template/invoice_template.html` | Jinja2 template rendered before PDF conversion |
| Static resources | `scripts/resources/`, `scripts/wkhtmltopdf/` | Logos and the PDF conversion executable/library |

## Runtime Flow

1. Electron starts from `src/main/index.ts`.
2. The main process creates a `BrowserWindow` with the preload script.
3. The React renderer loads `App.tsx`.
4. The renderer invokes file or directory dialogs through `window.electron.ipcRenderer.invoke`.
5. Selecting a client master invokes `getAllClients`, which starts `initial-clients.py`.
6. Starting invoice generation sends `run-script` with a positional argument array.
7. Starting email-agenda generation sends `run-script-mail-agenda` with a positional argument array.
8. Python stdout is converted into progress events by the main process.
9. The renderer displays progress, success toasts, and general error dialogs.

## IPC Contract

The renderer uses the Electron Toolkit `ipcRenderer` exposed by `@electron-toolkit/preload`. The custom `api` object is currently empty. The channels below are implemented in `src/main/index.ts`.

| Channel | Direction | Payload | Result/events |
| --- | --- | --- | --- |
| `open-directory-dialog` | renderer invokes main | none | Electron open-dialog result |
| `open-file-dialog` | renderer invokes main | none | Electron open-dialog result |
| `getAllClients` | renderer invokes main | `[clientMasterPath]` | `{ status, message, result }` |
| `checkDependencies` | renderer invokes main | none in current UI | Resolves after dependency-check script closes |
| `run-script` | renderer sends main | See invoice arguments below | `script-message`, `script-success`, `script-error` |
| `run-script-mail-agenda` | renderer sends main | See mail arguments below | `script-message-mail`, `script-success-mail`, `script-error-mail` |
| `ping` | main-process test channel | none | Logs `pong`; not used by the UI |

## Invoice Argument Contract

`App.tsx` sends the following array to `run-script`:

| Position | Value | Python meaning |
| ---: | --- | --- |
| 0 | `1` or `2` | Generation mode: batch or additional |
| 1 | `YYYYMMDD` | Selected invoice date |
| 2 | File path | Services-per-client workbook |
| 3 | File path | Client master workbook |
| 4 | File path | Invoice-number master workbook |
| 5 | Directory path | Main output folder |
| 6 | Integer | Number of selected clients |
| 7 onward | Client IDs | Selected client IDs |

The Python script receives the first argument separately as `dev` or `prod`. Electron prepends this environment value in `src/main/index.ts`, so the Python positions are shifted by one relative to the renderer array.

## Email Argument Contract

`App.tsx` sends the following array to `run-script-mail-agenda`:

| Position | Value | Python meaning |
| ---: | --- | --- |
| 0 | File path | Client master workbook |
| 1 | File path | Invoice-number master workbook |
| 2 | File path | New invoices CSV |
| 3 | File path | Pending invoices workbook |
| 4 | Directory path | Output folder |
| 5 | ISO-like datetime | Requested mail date and hour |

## Progress And Error Events

| Event | Producer | Renderer behavior |
| --- | --- | --- |
| `script-message` | Invoice main-process handler | Splits messages on `$$` and displays the log |
| `script-success` | Invoice main-process handler | Shows invoice success toast and stops loading |
| `script-error` | Invoice main-process handler | Shows the generation error dialog |
| `script-message-mail` | Mail main-process handler | Splits messages on `$$` and displays the log |
| `script-success-mail` | Mail main-process handler | Shows email-agenda success toast and stops loading |
| `script-error-mail` | Mail main-process handler | Shows the email-agenda error dialog |

## Development And Packaged Paths

`src/main/index.ts` uses different relative routes for development and production. In development, scripts are resolved from the repository's `scripts` directory. In a packaged application, `electron-builder.yml` includes `scripts/**` as an extra resource and asar-unpacked content; the main process resolves the packaged resource route.

The Python invoice script then uses:

- `scripts/` as its development working resource location.
- `resources/scripts/` as its packaged resource location.
- `wkhtmltopdf/wkhtmltox/bin/wkhtmltopdf.exe` below the selected resource location.

When changing packaging or paths, test both `npm run dev` and the installed Windows executable.

## Security Boundary

The renderer can request dialogs and start scripts through the exposed Electron API. File processing occurs in Python with paths supplied by the user. Input workbooks and generated outputs may contain confidential financial and customer data. They must remain outside source control.
