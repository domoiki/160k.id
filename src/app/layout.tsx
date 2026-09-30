import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { contact, site, social } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "160K — Cloud communication infrastructure for A2P messaging and OTP",
    template: "%s — 160K",
  },
  description: site.description,
  applicationName: "160K",
  keywords: [
    "A2P messaging",
    "enterprise SMS",
    "OTP solution",
    "flash call OTP",
    "WhatsApp OTP",
    "targeted SMS",
    "location based advertising",
    "contextual communication",
    "SMPP v3.4",
    "cloud communication",
  ],
  authors: [{ name: site.legalName }],
  creator: site.legalName,
  publisher: site.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: "160K",
    title: "160K — Cloud communication infrastructure for modern businesses",
    description: site.description,
    images: [
      {
        url: "/assets/brand/logo-mark.webp",
        width: 240,
        height: 239,
        alt: "160K",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "160K — Cloud communication infrastructure for modern businesses",
    description: site.description,
    images: ["/assets/brand/logo-mark.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport = {
  themeColor: "#05070c",
  colorScheme: "dark" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  /* Only facts already published on 160k.co.id. No ratings, no review counts,
     no awards — nothing this company has not stated itself. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    legalName: site.legalName,
    alternateName: site.shortLegalName,
    url: site.url,
    logo: `${site.url}/assets/brand/logo-mark.webp`,
    description: site.description,
    foundingDate: site.founded,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.addressLines[0],
      addressLocality: "Jakarta Utara",
      postalCode: "14440",
      addressCountry: "ID",
    },
    email: contact.email,
    sameAs: social.map((s) => s.href),
  };

  return (
    <html
      lang="en"
      // This site is natively dark by design. Dark Reader exists to invert
      // light pages, so on this one it achieves nothing visually while
      // rewriting inline styles and SVG attributes before React hydrates —
      // which React reports as an unpatchable attribute mismatch on every
      // <img> and <path>. `data-darkreader-ignore` is Dark Reader's own
      // documented opt-out; scoping it to the document root keeps the
      // extension installed and working everywhere else.
      data-darkreader-ignore=""
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-void">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-[2px] focus:bg-brand-solid focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
