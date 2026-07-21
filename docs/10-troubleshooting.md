# Troubleshooting

## General Recovery Rules

1. Stop the current run when the output is incomplete or unexpected.
2. Preserve the application log and Python stderr, removing confidential values before sharing them.
3. Record the application version and selected workflow.
4. Check whether the invoice-number master or accountability CSV changed.
5. Compare the selected inputs with the workbook contracts.
6. Restore from backup before retrying when a mutation is incorrect.
7. Rerun only after identifying and correcting the cause.

## Application Does Not Start

Check:

- The delivered executable is complete and was not blocked or quarantined.
- The Windows machine meets the supported-environment requirements.
- The package includes its `resources` and `scripts` content.
- The user has permission to run the executable and write to required directories.

For a development run, reinstall dependencies with `npm install` and try `npm run dev`.

## Dependency Check Does Not Complete

Likely causes:

- Python is not available to the process launched by PythonShell.
- `pip` cannot reach the package index.
- The user lacks permission to install packages.
- One of the required packages fails to import.

Confirm the Python executable available to the same user account, then run the dependency check again. The dependency checker installs packages dynamically and does not use a repository requirements file.

## Client Master Will Not Load

Check:

- The file is an Excel workbook readable by pandas.
- The workbook contains `ID`, `Bank Code`, `Bank Name`, and `Country`.
- The file is not locked by another process.
- The selected path is the intended workbook.
- Values are not errors or unsupported formula results.

The UI clears the selected client-master path after a controlled loading error.

## Invoice Generation Is Disabled

The generate button requires:

- At least one selected client.
- Client master path.
- Services-per-client path.
- Invoice-number master path.
- Output folder path.

Load the client master first so the client list is available.

## Invoice PDF Is Missing

Check the UI log for:

- No service rows for the invoice ID.
- Service-description and amount length mismatch.
- Unsupported language value.
- Python stderr from pandas, Jinja2, pdfkit, or `wkhtmltopdf`.

Then verify:

- The `INVOICES` folder exists or can be created.
- The output directory is writable.
- The packaged `wkhtmltopdf.exe` exists at the expected path.
- The invoice template and logo resources are packaged.

## PDF Looks Incorrect

Check:

- Language and currency values in the client master.
- Client information and comments for newline formatting.
- Service descriptions and month tokens.
- Logo selection rules.
- Changes to `scripts/main_template/invoice_template.html`.

If the template was changed, validate both English and Spanish invoices and at least one invoice with multiple services.

## Credit Note Is Missing

Check that the client master `NC` value is numeric or evaluates to `1`. Confirm that the output folder contains `CREDIT_NOTES`. Review the log for errors during the corresponding invoice generation.

## Accountability CSV Is Unexpected

Check:

- Generation mode.
- Existing CSV backup and contents.
- `Amount` values in the services workbook.
- Matching entries in `scripts/exception_list.py`.
- UTF-8 BOM encoding when opening in Excel.

Additional-invoice mode appends to an existing monthly accountability file. Batch mode creates a new file for the target month.

## Invoice Number Changed Unexpectedly

Check:

- Generation mode.
- `Additional Invoices` before and after the run.
- Invoice master number and month seed columns.
- Selected client IDs.
- Current base-month implementation.

Restore the invoice master from backup before retrying if the number is not approved.

## Email Agenda Is Missing

Check:

- All five paths are selected.
- The new-invoices CSV contains the expected invoice columns.
- The pending workbook headers appear after the skipped first row.
- `Mail Recipient` is populated for the intended clients.
- Invoice numbers contain the expected bank-code prefix.
- `EMAIL_AGENDA.xlsx` does not already exist.

## Email Agenda Is Not Replaced

This is intentional behavior. The script skips saving when `EMAIL_AGENDA.xlsx` already exists. Back up and remove or rename the existing file only after following the approved finance procedure.

## Reporting An Issue

Provide:

- Application version.
- Workflow and date of the run.
- Sanitized input schema and row counts.
- Sanitized UI log and Python error text.
- Whether the invoice master or accountability CSV changed.
- Expected versus actual output names.
- Steps already taken.

Never attach production workbooks, bank details, recipient lists, or unredacted PDFs to an issue unless the data owner explicitly approves it.
