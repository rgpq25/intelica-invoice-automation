# Invoice Auto Documentation

This folder is the maintenance and operations guide for `invoice-auto`, the Intelica desktop application used to generate invoices, credit notes, accountability files, and email agendas.

## Read In This Order

| File | Use it for |
| --- | --- |
| [01-purpose-and-scope.md](01-purpose-and-scope.md) | Product purpose, users, scope, and terminology |
| [02-system-architecture.md](02-system-architecture.md) | Electron, React, IPC, Python, and packaged-resource boundaries |
| [03-development-setup.md](03-development-setup.md) | Local setup, commands, debugging, and validation |
| [04-operator-runbook.md](04-operator-runbook.md) | Day-to-day invoice and email-agenda procedures |
| [05-input-workbook-contracts.md](05-input-workbook-contracts.md) | Required workbook and CSV structures |
| [06-invoice-generation.md](06-invoice-generation.md) | Invoice, credit-note, numbering, and accountability behavior |
| [07-email-agenda-generation.md](07-email-agenda-generation.md) | Email agenda generation and invoice grouping |
| [08-output-contracts.md](08-output-contracts.md) | Generated files, names, locations, and mutation rules |
| [09-release-and-packaging.md](09-release-and-packaging.md) | Windows installer creation and delivery |
| [10-troubleshooting.md](10-troubleshooting.md) | Setup, input, generation, and output failures |
| [11-maintenance-reference.md](11-maintenance-reference.md) | Source map, change guidance, owners, and open confirmations |

## Quick Start

For a user running the application, start with [04-operator-runbook.md](04-operator-runbook.md).

For a developer changing the application, read [02-system-architecture.md](02-system-architecture.md), then [03-development-setup.md](03-development-setup.md), and finally the workflow chapter affected by the change.

For a release, follow [09-release-and-packaging.md](09-release-and-packaging.md).

## Documentation Rules

- Documentation is written in English.
- Examples must be sanitized. Do not commit production client records, bank details, email addresses, credentials, local paths, or copied production workbook contents.
- Use relative links between files in this folder.
- Keep implementation details tied to a source file. If behavior changes, update the relevant chapter in the same change.
- Document intended behavior as policy. Put unconfirmed rules in the owner-confirmation sections instead of presenting them as business policy.
- Generated PDFs, CSV files, Excel files, and customer data remain outside Git.

## Ownership

| Role | Owner |
| --- | --- |
| Technical owner | Renzo Pinto |
| Main application user | Mauricio del Rosario |
| Business-rule confirmation | Finance/business owner, coordinated with the technical owner |

## Current Application Summary

The application is an Electron desktop application with a React and TypeScript renderer. The Electron main process opens file and directory dialogs, starts Python scripts, and forwards progress events to the renderer. Python scripts read Excel and CSV inputs and create invoice PDFs, credit-note PDFs, accountability CSV files, invoice summaries, and email-agenda workbooks.

The production distribution is currently Windows-first. The repository exposes macOS and Linux build commands, but the invoice workflow relies on the bundled Windows `wkhtmltopdf.exe` path and those platforms should not be treated as production-supported without separate validation.
