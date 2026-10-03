# Contributing

Thanks for helping improve this project! By contributing you agree your work is released under the project's [MIT license](LICENSE).

## Getting set up

Follow [Getting started in the README](README.md#getting-started). Then read [`AGENTS.md`](AGENTS.md) and the `CONTEXT.md` of the app you're changing; they define the conventions reviewers check.

## Workflow

1. Open an issue first for anything bigger than a small fix, so we can agree on the approach.
2. Fork, then branch from `main`: `feat/short-description` or `fix/short-description`.
3. Keep changes focused: one concern per pull request.
4. Before pushing, run:
   ```bash
   pnpm lint
   pnpm check-types
   pnpm format
   ```
   API changes should also pass `pnpm --filter api test:integration` (against a scratch database only; see the README).
5. Open a pull request using the template and link the issue.

## Rules that matter most

- **Shared types and Zod schemas live in `@ecommerce/contracts`.** Never redefine them in an app.
- **Money is PKR.** Format with `formatMoney()`; shipping prices live only in `packages/contracts/src/shipping.ts`.
- **Never commit secrets** (`.env`, keys, tokens) or customer data.
- Validate all input with Zod at the API boundary and keep the route → controller → service layering.
- If you change architecture or conventions, update the relevant `CONTEXT.md` / `AGENTS.md`.

## Commit messages

Short, imperative subject line (`Fix cart merge on login`), with details in the body if needed.

## Reporting security issues

Do **not** open a public issue. See [SECURITY.md](SECURITY.md).

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
