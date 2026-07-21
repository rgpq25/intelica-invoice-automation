# Release And Packaging

## Release Model

There is usually no automated release workflow. A release is a locally generated Windows executable or installer created with:

```bash
npm run build:win
```

The resulting executable is delivered directly to the person who needs to use the application.

## Pre-Release Checklist

1. Confirm the intended source branch and working tree.
2. Review the application version in `package.json`.
3. Confirm that no client workbooks, generated outputs, or secrets are staged.
4. Run the static validation commands.
5. Run a sanitized smoke test for both UI tabs.
6. Confirm that the invoice template, logos, and `wkhtmltopdf` resources are present.
7. Build the Windows package.
8. Install or run the produced package on a clean or approved Windows machine.
9. Validate invoice PDFs, credit notes, accountability CSV, invoice summary, and email agenda outputs.
10. Record the delivered version and artifact location.

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run build:win
```

`npm run build:win` runs the application build first and then invokes Electron Builder for Windows.

## Packaging Configuration

Packaging is configured in `electron-builder.yml`:

| Setting | Current behavior |
| --- | --- |
| Product name | `invoice-auto` |
| Windows executable | `invoice-auto` |
| Windows artifact | `${name}-${version}-setup.${ext}` |
| Build resources | `build/` |
| Extra resources | `scripts/**` |
| Asar unpack | `resources/**`, `scripts/**` |
| Desktop shortcut | Created by the NSIS configuration |

The package excludes source files, configuration files, README, and development metadata according to the `files` rules. Verify that any new runtime resource is included in `extraResources` or the asar-unpack list when necessary.

## Artifact Verification

After building, verify:

- The expected installer exists in `dist/`.
- The artifact version matches `package.json`.
- The application launches.
- The dependency check completes.
- The client master loads.
- Invoice generation can locate Python scripts and `wkhtmltopdf`.
- Email-agenda generation can locate its scripts and write workbooks.

## Delivery

Deliver the generated Windows installer or executable through the approved internal channel. Include:

- Application version.
- Build date.
- Source commit or branch.
- Validation result.
- Any owner-confirmed business-rule changes.

Do not include production workbook files with the executable unless the data owner explicitly approves that transfer.
