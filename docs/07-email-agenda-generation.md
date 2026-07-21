# Email Agenda Generation

The email workflow is implemented in `scripts/mail-agenda-generation.py` and started through the `run-script-mail-agenda` IPC channel.

## Purpose

This workflow prepares an Excel agenda for a later email process. It does not send email. The output includes recipient data, CC data, subject, HTML body, attachment file names, requested mail date, and a sent-status field.

## Processing Sequence

1. Read the client master and invoice-number master workbooks.
2. Read the new-invoices CSV.
3. Read the pending-invoices workbook after skipping its first row.
4. Build client records grouped by `Bank Code`.
5. Skip clients without a `Mail Recipient` value.
6. Group new invoice rows by bank code.
7. Match invoice IDs and calculate total amounts.
8. Build `INVOICE_SUMMARY.xlsx`.
9. Build email subject, HTML body, recipient, CC, and attachment names.
10. Build `EMAIL_AGENDA.xlsx` unless that file already exists.

## Client Grouping

New invoice numbers are grouped using the text before the first hyphen, interpreted as the bank code. Multiple invoices for the same bank code are combined into one agenda row.

If an invoice number ends in a letter, the workflow treats that letter as an identifier suffix and maps it back to a related client ID. Confirm that the invoice-number format remains compatible before changing numbering rules.

## Generated Email Content

The body includes:

- English or Spanish greeting based on `Language`.
- Standard language-specific invoice text.
- Special instructions for configured bank codes.
- A pending-invoice table, or a no-pending-invoices message.
- A sign-off.

Pending invoices with positive `Dias vencido` values are shown in red and bold. The body is HTML and uses `<br>` and table markup.

## Special Bank Rules

The script contains bank-code-specific text for some clients, including contract or purchase-order details. These values are business content embedded in code. Do not copy live values into documentation; update them only after finance/business-owner confirmation.

## Invoice Summary

`INVOICE_SUMMARY.xlsx` contains an invoice-level report with:

| Column | Meaning |
| --- | --- |
| `#` | Sequential row number |
| `Country` | Client country from `Country 2` |
| `Sales Person` | Client sales-person value |
| `Invoice No.` | New invoice number |
| `Client Name` | Bank/client name |
| `Currency` | Invoice currency |
| `Total Amount` | Formatted total |

The workbook also includes a currency summary table with invoice counts and total amounts.

## Email Agenda

`EMAIL_AGENDA.xlsx` contains a `Hoja1` sheet with the agenda table and a `Hoja2` sheet with the currency summary.

The agenda columns are:

| Column | Meaning |
| --- | --- |
| `ID` | Bank code or client grouping ID |
| `Country` | Client country |
| `InvoicesAmount` | Number of related client IDs |
| `Bank Name` | Client/bank name |
| `Invoice Number` | Invoice number used in the subject |
| `Currency` | Currency |
| `Total Amount` | Formatted grouped amount |
| `Mail Recipient` | Primary recipient |
| `Mail CC` | Comma-separated CC values |
| `Mail Title` | English or Spanish subject |
| `Mail Content` | Generated HTML body |
| `Mail Invoices` | Comma-separated attachment file names |
| `Mail Date` | Requested mail datetime |
| `Has been sent` | Initialized to `No` |

If `EMAIL_AGENDA.xlsx` already exists, the script logs a message and skips saving it. Review the existing file before rerunning and remove or rename it only according to the approved finance procedure.

## Common Input Problems

- The client master has no recipient for a client, so no agenda row is created.
- A bank code in the new-invoices CSV is absent from the client master.
- The pending workbook headers are not located after the expected skipped row.
- Invoice numbers do not match the expected bank-code format.
- Existing `EMAIL_AGENDA.xlsx` prevents replacement.
