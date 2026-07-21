# Input Workbook Contracts

These contracts describe fields read by the current implementation. Column names are case-sensitive in the code and should be treated as exact unless the code is changed at the same time.

All examples in this file are placeholders. Do not paste production rows into this document.

## Client Master

The client master is read by `scripts/initial-clients.py`, `scripts/main.py`, and `scripts/mail-agenda-generation.py`.

### Required For Client Loading

`initial-clients.py` requires these columns:

| Column | Used for |
| --- | --- |
| `ID` | Internal client identifier |
| `Bank Code` | Display label and invoice/email grouping |
| `Bank Name` | Display label and generated document name |
| `Country` | Display label and document name suffix |

### Required For Invoice Generation

| Column | Used for |
| --- | --- |
| `ID` | Joins the client record to service and invoice-master data |
| `Language` | `ENG` or `ESP` labels and date formatting |
| `Bank Code` | Invoice file name prefix and client identity |
| `Bank Name` | Invoice file name and client identity |
| `Country` | Optional invoice file name suffix |
| `Payment Terms` | Invoice payment terms |
| `Client Information` | Newline-separated client information block |
| `Other Comments` | Newline-separated comments block |
| `Currency` | Invoice and accountability currency |
| `NC` | `1` enables credit-note generation; blank values are treated as `0` |

### Required For Email Agenda

| Column | Used for |
| --- | --- |
| `ID` | Joins invoice metadata and related IDs |
| `Bank Code` | Groups invoice rows and identifies the client |
| `Bank Name` | Email summary and client identity |
| `Country 2` | Email summary country value |
| `Language` | English or Spanish email content |
| `Currency` | Email totals and summary totals |
| `Mail Recipient` | Primary recipient; blank values are skipped |
| `Mail CC` | Newline-separated CC addresses, later joined with commas |
| `Client Name` | Email greeting; falls back to `Client` when blank |
| `Sales Person` | Invoice summary field |

The client master may contain additional columns used by finance but not read by the application. Do not remove existing columns without confirming their use outside this repository.

## Services Per Client

The invoice workflow reads the `Client Data` sheet from this workbook.

| Column | Used for |
| --- | --- |
| `Invoice ID` | Selects service rows for each invoice-master/client ID |
| `Product` | Accountability CSV product/service value |
| `Service Description` | PDF service description and accountability description |
| `Amount` | PDF rate, PDF total, and accountability amount |

The implementation currently reads all rows matching each invoice ID. The commented month filter in `scripts/main.py` is not active, so the workbook supplied to a run must already represent the intended period.

The number of `Service Description` values must equal the number of `Amount` values for each invoice. A mismatch logs an error and skips PDF generation for that invoice.

## Invoice Number Master

The invoice-number master is read by both workflows.

| Column | Used for |
| --- | --- |
| `Invoice ID` | Joins client and service data |
| `Invoice Prefix` | Prefixes the generated invoice number |
| `20240701-NewNum` | Number seed used in invoice-number calculation |
| `20240701-NewMonth` | Month seed used in invoice-month calculation |
| `Added Letter` | Optional suffix added to calculated numbers |
| `Additional Invoices` | Count used by additional-invoice mode and incremented after it runs |
| `Name` | Name written to the accountability CSV customer field |

The historical `20240701-` column names are part of the current workbook contract even though the current Python code has a separate hardcoded base-month value. Confirm any renaming or base-month change with the business owner before implementation.

## New Invoices CSV

The invoice workflow creates the accountability CSV. The email workflow reads it with pandas. Its columns are:

| Column | Meaning |
| --- | --- |
| `Invoice No.` | Generated invoice number |
| `*Customer` | Customer name on the first service row |
| `Email` | Currently blank |
| `Terms` | Payment terms on the first service row |
| `*Invoice Date` | Invoice date formatted as `DD/MM/YYYY` |
| `Due Date` | Currently the same formatted date as invoice date |
| `Location` | Currently blank |
| `Memo` | Generated memo on the first service row |
| `Message on Invoice` | Currently blank |
| `Send Later` | Currently blank |
| `Billing Currency` | Client currency |
| `*Product/Service` | Service product |
| `Description` | Service description with month tokens replaced |
| `Qty` | `1` |
| `Rate` | Accountability amount |
| `*Amount` | Accountability amount |
| `Tax Rate` | Currently blank |
| `Class` | Currently blank |

The file is written with UTF-8 with BOM (`utf-8-sig`) so Excel detects accented characters correctly.

## Pending Invoices Excel

The email workflow reads this file with `skiprows=1`, so it expects the actual column header after one leading row.

| Column | Used for |
| --- | --- |
| `No.` | Pending invoice number |
| `Date` | Pending invoice date |
| `Memo` | Service description in the email table |
| `Amount` | Pending invoice amount |
| `Dias vencido` | Overdue days; positive values are rendered in red |

## Date Formats

| Context | Format |
| --- | --- |
| Renderer-to-invoice script | `YYYYMMDD` |
| Invoice month calculations | `YYYYMM` |
| Accountability CSV invoice date | `DD/MM/YYYY` |
| Mail agenda date | ISO-like `YYYY-MM-DDTHH:00:00` string |

## Validation Before Use

- Confirm every required header exactly.
- Confirm identifiers match across workbooks.
- Confirm numeric amounts are numeric and non-empty where required.
- Confirm language values are `ENG` or `ESP`.
- Confirm the selected month is represented by the supplied data.
- Confirm no formulas are relying on unsaved external links.
