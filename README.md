This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Offline mode (one command)

CaseVault runs identically as a fully offline, single-laptop stack — no internet
dependency, no Supabase/Vercel network calls — switched purely by environment
configuration (`STORAGE_DRIVER`, `DATABASE_URL`/`DIRECT_URL`), never by code
branching.

1. `cp .env.local.example .env.local` and fill in `SESSION_SECRET` (generate one
   with `openssl rand -base64 32`).
2. `npm run dev:offline`

That single command:

- starts local Postgres 17 via Docker Compose (`docker compose up -d --wait`)
- applies all committed Prisma migrations, including the append-only audit-log
  trigger, against that local database (`prisma migrate deploy`)
- seeds the 5 demo accounts (`prisma db seed`)
- starts the app at [http://localhost:3000](http://localhost:3000) (`next dev`)

Requires Docker and Docker Compose installed and running.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
