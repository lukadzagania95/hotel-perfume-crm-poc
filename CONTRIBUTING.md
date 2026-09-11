# Contributing

Follow the [local setup](README.md#try-it-locally), use Node.js 22 or 24, and install with `npm ci`. npm and `package-lock.json` are the dependency source of truth.

## Changes

1. Create a branch for a focused change.
2. Keep business logic in `lib/` and validate form input in Server Actions.
3. Add a Prisma migration when changing the database schema.
4. Add meaningful tests when changing workflow, inventory, authentication, or email safety behavior.
5. Run `npm run check` before submitting a pull request.

Include the problem, resulting behavior, and verification in the pull request description. Update the current documentation when behavior changes; preserve `docs/planning/` as historical context.

Use fictional records and test-mode email settings for development. Environment files, local databases, and mailbox credentials must stay outside version control.
