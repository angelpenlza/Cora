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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
