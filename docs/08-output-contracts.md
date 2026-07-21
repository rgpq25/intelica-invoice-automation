# Output Contracts

The output folder selected by the operator is the parent directory for invoice workflow outputs. The email workflow writes its reports directly into its selected output folder.

## Invoice Workflow Outputs

| Path | Format | Behavior |
| --- | --- | --- |
| `INVOICES/` | Directory | Created when missing |
| `INVOICES/<document-name>.pdf` | PDF | One invoice PDF per successfully processed invoice |
| `CREDIT_NOTES/` | Directory | Created when missing |
| `CREDIT_NOTES/NC - <document-name>.pdf` | PDF | Created only when `NC == 1` |
| `Accountability - <YYMM> Monthly Invoices - QB.csv` | UTF-8 BOM CSV | Created for batch mode; appended or created for additional mode |
| Temporary generated-template directory | HTML files | Created during rendering and removed at normal completion |

The accountability file uses the last two digits of the year and the selected month. Its exact columns are listed in [05-input-workbook-contracts.md](05-input-workbook-contracts.md).

## Invoice File Names

Invoice file names follow the current pattern:

```text
<bank-code-prefix> - Intelica Invoice - <bank name> <invoice number> - <country>.pdf
```

The title uses `Factura Intelica` for Spanish invoices. The country suffix is omitted when blank. Credit notes prepend `NC - ` and append `B` to the invoice number.

Use sanitized examples such as:

```text
CL - Intelica Invoice - Example Bank CL-2601 - Exampleland.pdf
NC - CL - Intelica Invoice - Example Bank CL-2601B - Exampleland.pdf
```

## Accountability Mutation Rules

| Mode | Existing accountability CSV | Result |
| --- | --- | --- |
| Batch | Any | Writes a new accountability CSV |
| Additional Invoice | Exists | Reads it, appends new rows, and rewrites it |
| Additional Invoice | Missing | Creates a new accountability CSV |

Additional-invoice mode also rewrites the invoice-number master after incrementing `Additional Invoices` for selected clients.

## Email Workflow Outputs

| File | Format | Behavior |
| --- | --- | --- |
| `INVOICE_SUMMARY.xlsx` | Excel workbook | Recreated by the email workflow |
| `EMAIL_AGENDA.xlsx` | Excel workbook | Created if absent; existing file is not overwritten |

`INVOICE_SUMMARY.xlsx` contains the invoice summary and currency summary tables. `EMAIL_AGENDA.xlsx` contains the email agenda and a currency summary with an `Emails Sent` column initialized to `0`.

## Regeneration Guidance

- PDFs can be regenerated from the source workbooks after confirming invoice-number and output state.
- A batch run replaces the accountability CSV for its target month.
- An additional-invoice run appends to the accountability CSV and mutates the invoice master.
- `EMAIL_AGENDA.xlsx` must be reviewed before removal because the script intentionally skips an existing file.
- Never delete or replace outputs before making a backup when the result may be needed for accounting or audit.

## Confidentiality

All PDFs, CSV files, Excel reports, and source workbooks may contain confidential customer, banking, payment, or recipient data. Store them only in approved locations and do not commit them to Git.
