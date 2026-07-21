# Maintenance Reference

## Source Map

| Change area | Primary source | Related source |
| --- | --- | --- |
| Window creation and packaged paths | `src/main/index.ts` | `electron-builder.yml` |
| Renderer workflow and validation | `src/renderer/src/App.tsx` | `src/renderer/src/types.ts` |
| Electron API exposure | `src/preload/index.ts` | `src/preload/index.d.ts` |
| Client loading | `scripts/initial-clients.py` | `src/main/index.ts` |
| Invoice generation | `scripts/main.py` | `scripts/main_template/invoice_template.html` |
| Credit notes | `scripts/main.py` | Invoice template |
| Accountability exceptions | `scripts/exception_list.py` | `scripts/main.py` |
| Email agenda | `scripts/mail-agenda-generation.py` | `scripts/exception_list.py` |
| Dependency installation | `scripts/dependency-check.py` | `package.json` |
| UI components and styles | `src/renderer/src/components/` | `src/renderer/src/assets/main.css` |
| Build and packaging | `package.json`, `electron.vite.config.ts` | `electron-builder.yml` |

## Change Guidance

| If you change... | Also review... |
| --- | --- |
| IPC channel name | `App.tsx`, `src/main/index.ts`, and [02-system-architecture.md](02-system-architecture.md) |
| Positional Python arguments | `App.tsx`, the Python `sys.argv` reads, and [05-input-workbook-contracts.md](05-input-workbook-contracts.md) |
| Workbook column | All scripts reading that workbook and [05-input-workbook-contracts.md](05-input-workbook-contracts.md) |
| Invoice number calculation | Invoice master contract, output names, additional mode, and [06-invoice-generation.md](06-invoice-generation.md) |
| PDF template | English, Spanish, multi-service, and credit-note smoke cases |
| Logo or packaged resource | Development path, packaged path, and [09-release-and-packaging.md](09-release-and-packaging.md) |
| Accountability exception | Finance owner confirmation, CSV output validation, and [08-output-contracts.md](08-output-contracts.md) |
| Email text or special bank rule | Business owner confirmation and [07-email-agenda-generation.md](07-email-agenda-generation.md) |
| Output file behavior | Operator runbook, output contract, and troubleshooting guidance |

## Business Rules Requiring Confirmation

The following items are implemented in code but should not be treated as confirmed policy without finance/business-owner review:

| Rule | Implementation location | Confirmation needed |
| --- | --- | --- |
| Invoice-number base month | `scripts/main.py` and `scripts/mail-agenda-generation.py` | Confirm the authoritative base month and why historical column names remain `20240701-*` |
| Batch and additional numbering | `scripts/main.py` | Confirm that additional mode must mutate `Additional Invoices` |
| Credit-note eligibility | Client master `NC` and `scripts/main.py` | Confirm which clients require credit notes and the meaning of `1` |
| Accountability amount exceptions | `scripts/exception_list.py` | Confirm each exception, effective period, and owner |
| Special email text | `scripts/mail-agenda-generation.py` | Confirm active bank-specific contract and purchase-order text |
| Payment information in invoice template | `scripts/main_template/invoice_template.html` | Confirm the authoritative source and review process for payment details |
| Language values | `scripts/main.py` and email script | Confirm that only `ENG` and `ESP` are valid |
| Pending workbook leading row | `scripts/mail-agenda-generation.py` | Confirm why `skiprows=1` is required |

## Sanitized Smoke Test

Use a temporary test directory and synthetic data with placeholder clients, amounts, bank codes, and recipients.

1. Load a client master with one English client and one Spanish client.
2. Load service rows with one and multiple services.
3. Load an invoice master with valid number/month seeds.
4. Run batch invoice generation for both clients.
5. Verify invoice PDFs, dates, translations, totals, and accountability rows.
6. Run a credit-note case with a test `NC` value.
7. Run additional-invoice mode against a copied invoice master and verify the number increment and accountability append behavior.
8. Run email-agenda generation with a synthetic pending-invoice workbook.
9. Verify `INVOICE_SUMMARY.xlsx`, `EMAIL_AGENDA.xlsx`, recipients, HTML content, attachment names, and mail date.
10. Run the test again with an existing `EMAIL_AGENDA.xlsx` and verify the intentional skip behavior.

## Documentation Update Checklist

- Update the affected numbered chapter.
- Update `00-index.md` if files are added or renamed.
- Keep examples sanitized.
- Record any newly confirmed business rule.
- Update the output or workbook tables when contracts change.
- Run link and Markdown checks if they are added to the project later.
- Run the static checks and relevant smoke tests.

## Ownership And Escalation

Technical implementation questions go to Renzo Pinto. Day-to-day application behavior and finance workflow questions should be validated with Mauricio del Rosario and the finance/business owner before changing code or hardcoded business rules.

Issue reports should include the sanitized details listed in [10-troubleshooting.md](10-troubleshooting.md).
