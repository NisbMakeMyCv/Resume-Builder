import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import GoogleProvider from "./components/GoogleProvider";
import SplashScreen from "./components/SplashScreen";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "NISB-MakeMyCV — Build Your Dream Resume",
    template: "%s | NISB-MakeMyCV",
  },
  description:
    "The clean, AI-assisted resume builder. Pick the Jake template, tell your story, and get hired.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Material Symbols Outlined — used by all stitch frames for icons */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        <GoogleProvider>{children}</GoogleProvider>
      </body>
    </html>
  );
}
