This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

### CookieCapes account deployment

CookieAPI must be upgraded before this website. Configure `WEBSITE_SERVICE_TOKEN`
with the API's dedicated website service credential and `COOKIECAPES_API_URL` with
its origin; never expose credentials through `NEXT_PUBLIC_` variables.
Set `NEXT_PUBLIC_COOKIECAPES_API_URL` to the public API origin before building
(for production, `https://api.cookieattack.de`); this value contains no secret.
Auth.js now uses CookieAPI-backed database sessions and internal user UUIDs.
Existing website JWT sessions require signing in again. Discord IDs remain linked
identity metadata for `ADMIN_DISCORD_IDS` and the separate homepage registration.
Do not enable email-based automatic OAuth account linking for future providers.

Register the exact MC-ID redirect URI
`https://YOUR-WEBSITE/cookiecapes/account/minecraft/callback` in CookieAPI and at
MC-ID. Linking stays unavailable when the API reports `mcid_enabled: false`.
CookieAPI performs OIDC verification and enforces upload/review authorization;
the browser receives neither provider secrets nor the service credential.

The account page provides explicit legacy review and 30-day recovery. Blue badges
mean a linked owner uploaded or claimed a cape; orange badges mean a verified
Minecraft session uploaded it. Neither badge establishes artwork authorship.
Private cape previews use an authenticated, non-cacheable website proxy.

For local end-to-end testing of all three repositories, see
[the workspace testing guide](../CookieAPI/docs/local-testing.md).
