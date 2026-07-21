# Invoice Generation

The invoice workflow is implemented in `scripts/main.py` and started through the `run-script` IPC channel.

## Modes

| UI mode | Internal mode | Intended behavior |
| --- | ---: | --- |
| Batch | `1` | Generate the selected clients' normal monthly invoices |
| Additional Invoice | `2` | Generate an additional invoice and increment `Additional Invoices` for selected clients |

Additional-invoice mode adds one to the calculated invoice number relative to batch mode and updates the invoice-number master after processing. It appends accountability rows to an existing accountability CSV when that file exists.

## Processing Sequence

1. Read the three input workbooks.
2. Read client service rows from the `Client Data` sheet.
3. Read invoice-number metadata and calculate the month difference from the configured base month.
4. Filter to the selected client IDs.
5. Create `INVOICES`, `CREDIT_NOTES`, and temporary generated-template directories when missing.
6. Load the Jinja2 invoice template.
7. For each selected invoice, calculate the invoice number and invoice month.
8. Replace month tokens in service descriptions.
9. Render HTML and convert it to PDF using `wkhtmltopdf`.
10. Generate a credit note when `NC == 1`.
11. Append service rows to the accountability dataframe.
12. Write or extend the accountability CSV according to the selected mode.
13. In additional-invoice mode, increment `Additional Invoices` for selected clients and rewrite the invoice master.
14. Remove the temporary generated-template directory.

## Invoice Number Calculation

The invoice master supplies:

- `Invoice Prefix`.
- `20240701-NewNum`.
- `20240701-NewMonth`.
- `Added Letter`.
- `Additional Invoices`.

The script calculates the month difference between the selected current date and its hardcoded base-month value. It then calculates the new invoice month and number. In batch mode, the number uses the seed plus the month difference and `Additional Invoices`. In additional mode, it adds one more to the number.

The exact business meaning of the current base-month value must be confirmed before changing it. See [11-maintenance-reference.md](11-maintenance-reference.md).

## Month Tokens

The scripts support these tokens in service descriptions and memo text:

| Token | Meaning |
| --- | --- |
| `%&ENG_MONTH_CAP&%` | Capitalized English month and year |
| `%&ENG_MONTH&%` | Lowercase English month and year |
| `%&ESP_MONTH_CAP&%` | Capitalized Spanish month and year |
| `%&ESP_MONTH&%` | Lowercase Spanish month and year |
| `%&ENG_MONTH_CAP_PREVIOUS&%` | Previous month in capitalized English |

The token is calculated from the invoice month, not directly from the current UI date.

## PDF Generation

The Jinja2 template is `scripts/main_template/invoice_template.html`. The script provides document name, logo, invoice details, client information, comments, services, total, currency, and translated labels.

The PDF converter is configured with a page size of 8.5 by 11 inches and 300 DPI. The converter binary is expected at the packaged or development `wkhtmltopdf` resource path.

The document name follows this pattern:

```text
<first-two-bank-code-characters> - <Intelica Invoice or Factura Intelica> - <bank name> <invoice number> [ - <country>].pdf
```

The country suffix is omitted when the country field is blank.

## Languages

`ENG` creates English labels and English-formatted dates. `ESP` creates Spanish labels and Spanish-formatted dates. Any other language value causes that invoice to be logged as an error and skipped.

The Python process uses system locales for date formatting. A Windows environment must support the required locale behavior for Spanish month names.

## Credit Notes

When the client master value `NC` is `1`:

- A second PDF is generated under `CREDIT_NOTES`.
- Its invoice number is the invoice number with `B` appended.
- Service rates and the total are rendered as negative values.
- The title is `Credit Note` in English or `Nota de Crédito` in Spanish.
- The file name is prefixed with `NC - `.

The credit-note condition and wording are business rules and should be confirmed before changing the `NC` data or implementation.

## Accountability Rows

The script creates one accountability row per service. The first row contains customer, terms, date, memo, currency, and product context. Additional service rows for the same invoice leave those contextual fields blank.

Some invoice IDs and service amounts use a separate accountability amount from the PDF service amount. These exception values are defined in `scripts/exception_list.py`. The PDF continues to use the invoice amount; the accountability CSV uses the replacement amount when the configured exception matches.

## Failure And Skip Behavior

- Empty service data exits after logging an error.
- Missing service rows for an invoice ID are logged and skipped.
- Mismatched service-description and amount lengths skip the invoice PDF.
- Unsupported language values skip the invoice.
- Python stderr is returned as `script-error` by the Electron main process.
- Temporary generated HTML is removed at normal completion.

When a run fails, inspect the invoice master and accountability CSV before rerunning. Additional-invoice mode can mutate the invoice master and append to the accountability file.
