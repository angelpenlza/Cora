## Getting Started

npm install
npm install @supabase/ssr
npm install @supabase/supabase-js
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-request-presigner
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

