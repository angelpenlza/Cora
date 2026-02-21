## Getting Started

* npm install
* npm install @supabase/ssr
* npm install @supabase/supabase-js
* create .env.local in the main project and add:
    * NEXT_PUBLIC_SUPABASE_URL=url
        ^ found in Project Settings > Data API
    * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=key
        ^ found in Project Settings > API Keys
* npm install resend (resend setup was configured through supabase so no api key needed here)


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

## PWA / iOS splash screens

The app is set up as a PWA with device-specific iOS splash screens. To generate the splash images (e.g. with [pwa-asset-generator](https://www.npmjs.com/package/pwa-asset-generator)), use your logo (e.g. `public/assets/` or an SVG) and output files named `apple-splash-{width}-{height}.jpg` into `public/`. The layout expects these filenames (see `src/app/layout.tsx`). Until the files exist, iOS will use the page background color as the splash.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
