# Operator Runbook

This runbook describes the intended user process. Confirm the input contracts in [05-input-workbook-contracts.md](05-input-workbook-contracts.md) before starting.

## Before Any Run

1. Confirm that the selected files are the approved versions for the target month.
2. Make a backup copy of the invoice-number master workbook.
3. Make a backup copy of any existing accountability CSV in the output folder.
4. Confirm that the output folder is writable and contains no files that should be preserved under the same names.
5. Confirm the application version from the delivered executable or release record.
6. Do not include production files in screenshots, logs, issue reports, or Git commits.

## Invoice Generation

### Select Inputs

In the `Invoice Generation` tab, select:

1. `Client Master`.
2. `Services per Client`.
3. `Invoice Number Master`.
4. `Output Folder`.

Selecting the client master causes the application to load client choices. If clients do not load, stop and resolve the input issue before continuing.

### Select Configuration

1. Choose `Batch` for the normal monthly run.
2. Choose `Additional Invoice` only when an extra invoice is required for selected clients.
3. Select the invoice date.
4. Select or clear individual clients. Use the search field to filter the list.
5. Confirm that every required path is populated and at least one client is selected.

### Run

1. Select `Generate Invoices`.
2. Keep the application open until the success toast or error dialog appears.
3. Review the progress log for errors, skipped invoices, service/amount mismatches, and the final output message.
4. Inspect the output folders and accountability file described in [08-output-contracts.md](08-output-contracts.md).
5. Validate invoice numbers, dates, languages, currencies, totals, service descriptions, and client information before delivery.

### Additional Invoice Precautions

Additional-invoice mode updates the `Additional Invoices` column in the invoice-number master for selected clients. It also appends to an existing accountability CSV when one exists. Use the backup made before the run if the result needs to be reversed.

## Email Agenda Generation

### Select Inputs

In the `Automatic Mail Excel` tab, select:

1. `Client Master`.
2. `Invoice Number Master`.
3. `New Invoices CSV`, normally the accountability CSV from invoice generation.
4. `Pending Invoices Excel`.
5. `Output Folder`.

### Select Mail Date

1. Select the intended mail date.
2. Enter the hour from `0` through `23`.
3. The application uses minute `00` and passes an ISO-like datetime string to Python.

### Run And Validate

1. Select `Generate excel`.
2. Wait for the success toast or error dialog.
3. Review the log for missing clients or skipped recipient records.
4. Open `EMAIL_AGENDA.xlsx` and verify recipients, CC values, invoice numbers, attachment names, mail content, mail date, and `Has been sent` values.
5. Review `INVOICE_SUMMARY.xlsx` against the new-invoice data.
6. The application prepares an agenda; it does not send email.

## Completion Checklist

- Correct month and date selected.
- Correct client set selected.
- All required input files open successfully.
- Invoice PDFs have the expected names and totals.
- Credit notes exist where required.
- Accountability CSV has the expected rows and encoding.
- Email agenda recipients and attachments were reviewed.
- Existing output files were not unintentionally overwritten or skipped.
- Source workbooks and generated outputs are stored securely.

## If Something Fails

Do not rerun blindly. Preserve the visible log, note the application version, check whether the invoice-number master or accountability file changed, and follow [10-troubleshooting.md](10-troubleshooting.md).
