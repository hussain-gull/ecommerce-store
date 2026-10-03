# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately via GitHub: **Security tab → "Report a vulnerability"** on this repository. Include:

- what is affected (app, route or file) and the impact,
- steps to reproduce or a proof of concept,
- any suggested fix.

We aim to acknowledge reports within 5 days and to keep you updated until it's resolved. Please allow time to fix before any public disclosure.

## Scope

In scope: `apps/api`, `apps/web`, `apps/admin`, `packages/*`, and the deployment guidance in [DEPLOYMENT.md](DEPLOYMENT.md).
Out of scope: vulnerabilities in third-party services (Cloudinary, Resend, hosting providers) and issues that need an already-compromised device or admin account.

## Supported versions

Only the latest commit on `main` receives security fixes.

## Known, accepted gaps

Listed in [DEPLOYMENT.md](DEPLOYMENT.md#known-gaps-accepted-for-launch): no admin MFA, per-instance rate-limit counters, report-only storefront CSP.

## For people deploying this project

Follow the [deployment checklist](DEPLOYMENT.md): generate your own secrets, set `NODE_ENV=production`, `CORS_ORIGINS` and `TRUST_PROXY_HOPS`, and never commit `.env` files.
