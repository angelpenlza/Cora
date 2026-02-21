import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "./components/navbar";
import RegisterSw from "./components/register-sw";
import './styles/globals.css';
import './styles/forms.css';
import { createClient } from "@/lib/supabase/server";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// iOS splash screens from Progressier (public/assets/splash_screens/)
const splash = (name: string) => `/assets/splash_screens/${name}.png`;

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Cora",
  description: "A community reporting platform",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cora",
    startupImage: [
      { url: splash("12.9__iPad_Pro_portrait"), media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("12.9__iPad_Pro_landscape"), media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("11__iPad_Pro__10.5__iPad_Pro_portrait"), media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("11__iPad_Pro__10.5__iPad_Pro_landscape"), media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait"), media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_landscape"), media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("8.3__iPad_Mini_portrait"), media: "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("8.3__iPad_Mini_landscape"), media: "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("10.9__iPad_Air_portrait"), media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("10.9__iPad_Air_landscape"), media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("10.5__iPad_Air_portrait"), media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("10.5__iPad_Air_landscape"), media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("10.2__iPad_portrait"), media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("10.2__iPad_landscape"), media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait"), media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape"), media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait"), media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_17_Pro__iPhone_17__iPhone_16_Pro_landscape"), media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait"), media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape"), media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait"), media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape"), media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait"), media: "(device-width: 440px) and (device-height: 996px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape"), media: "(device-width: 440px) and (device-height: 996px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait"), media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape"), media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait"), media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape"), media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait"), media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape"), media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_11__iPhone_XR_portrait"), media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("iPhone_11__iPhone_XR_landscape"), media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait"), media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: splash("iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape"), media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: splash("iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait"), media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape"), media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: splash("4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait"), media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: splash("4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape"), media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const supabase = await createClient();
  const { 
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" style={{ backgroundColor: '#ffffff' }}>
      <head>
         <Analytics />
         <SpeedInsights />
        <link rel="icon" type="image/png" href="/assets/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
        <link rel="shortcut icon" href="/assets/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#ffffff' }}
      >
        <RegisterSw />
        <NavBar user={user}/>
        {children}
      </body>
    </html>
  );
}
