/**
 * Single source of truth for all 160K copy and technical facts.
 *
 * Everything here is derived from the public 160K website (160k.co.id)
 * and the official "TKDI - SMS Gateway - SMPP Interface v1.0" specification
 * linked from 160k.co.id/api/.
 *
 * RULE: nothing is invented here. If a fact is not on the public site or in
 * the spec, it does not belong in this file.
 */

export const site = {
  name: "160K",
  legalName: "PT. Teknologi Komunikasi Digital Indonesia",
  shortLegalName: "TKDI",
  domain: "160k.co.id",
  url: "https://160k.co.id",
  tagline: "Communication infrastructure for modern businesses.",
  founded: "2014",
  description:
    "160K is a cloud service provider for A2P messaging, OTP solutions, contextual communication technology and international prepaid SIM cards, built in Indonesia since 2014.",
} as const;

export const contact = {
  email: "support@160k.id",
  whatsapp: "+62 812-1235-1238",
  whatsappHref: "https://wa.me/6281212351238",
  whatsappAlt: "+62 878-7498-0855",
  whatsappAltHref: "https://wa.me/6287874980855",
  addressLines: ["Jl. Jembatan Tiga Raya", "Jakarta Utara 14440", "Indonesia"],
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Jl.+Jembatan+Tiga+Raya+Jakarta+Utara+14440",
} as const;

/** Only accounts that are actually published on 160k.co.id. */
export const social = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/pt-teknologi-komunikasi-digital-indonesia" },
  { label: "Facebook", href: "https://www.facebook.com/tkdi2017" },
] as const;

export type NavItem = { label: string; href: string; children?: { label: string; href: string; note: string }[] };

export const nav: NavItem[] = [
  {
    label: "Products",
    href: "/products",
    children: [
      { label: "A2P Messaging", href: "/products/a2p-messaging", note: "Enterprise and wholesale SMS" },
      { label: "OTP Solution", href: "/products/otp-solution", note: "Flash call and WhatsApp OTP" },
      { label: "Location Based Advertising", href: "/products/location-based-advertising", note: "Location-targeted campaigns" },
      { label: "Targeted SMS", href: "/products/targeted-sms", note: "Profile-matched messaging" },
      { label: "Contextual Communication", href: "/products/contextual-communication", note: "Ringlerr branded calling" },
      { label: "Roaming SIM Card", href: "/products/roaming-simcard", note: "Holiday SIM, plug and play" },
    ],
  },
  { label: "Solutions", href: "/#architecture" },
  { label: "Company", href: "/about" },
  { label: "Resources", href: "/api" },
  { label: "Contact", href: "/contact" },
];

export type Product = {
  slug: string;
  name: string;
  /** Short factual description, rewritten from the public page. */
  summary: string;
  /** Technical metadata shown as a spec line. Never decorative filler. */
  meta: { label: string; value: string }[];
  image: string;
  imageAlt: string;
  href: string;
};

export const products: Product[] = [
  {
    slug: "a2p-messaging",
    name: "A2P Messaging",
    summary:
      "Application-to-person messaging — text sent from a software application to a consumer's device. Used for authentication, transaction alerts and campaigns across e-commerce, banking, telecom, travel and ride hailing.",
    meta: [
      { label: "Delivery", value: "MT-SMS" },
      { label: "Scale", value: "Enterprise & wholesale" },
      { label: "Interface", value: "SMPP v3.4" },
    ],
    image: "/assets/products/a2p-messaging.webp",
    imageAlt: "160K A2P messaging illustration",
    href: "/products/a2p-messaging",
  },
  {
    slug: "otp-solution",
    name: "OTP Solution",
    summary:
      "One-time password delivery over flash call and WhatsApp. A flash call places a missed call whose final digits carry the code; WhatsApp delivers the message unaltered.",
    meta: [
      { label: "Channels", value: "Flash call, WhatsApp" },
      { label: "Code length", value: "Last 4–6 digits" },
      { label: "Content", value: "Unaltered" },
    ],
    image: "/assets/products/otp-solution.webp",
    imageAlt: "160K OTP solution example",
    href: "/products/otp-solution",
  },
  {
    slug: "location-based-advertising",
    name: "Location Based Advertising",
    summary:
      "Campaigns delivered according to the audience's geographical location, pinpointing a subscriber's position and serving the right message to that device.",
    meta: [
      { label: "Target input", value: "Geographical location" },
      { label: "Delivery", value: "Mobile device" },
      { label: "Use", value: "Advertising campaigns" },
    ],
    image: "/assets/products/location-based-advertising.webp",
    imageAlt: "160K location based advertising example",
    href: "/products/location-based-advertising",
  },
  {
    slug: "targeted-sms",
    name: "Targeted SMS",
    summary:
      "Define a customer profile — age, sex, device OS, religion, monthly usage and ARPU, hobby or interest — then build text or image campaigns that match it.",
    meta: [
      { label: "Filters", value: "Profile attributes" },
      { label: "Creative", value: "Text or image" },
      { label: "Channel", value: "SMS" },
    ],
    image: "/assets/products/targeted-sms.webp",
    imageAlt: "160K targeted SMS campaign example",
    href: "/products/targeted-sms",
  },
  {
    slug: "contextual-communication",
    name: "Contextual Communication",
    summary:
      "Ringlerr is a real-time consumer engagement solution offering a verified, trusted and branded calling experience to end users, raising call and sales conversion.",
    meta: [
      { label: "Product", value: "Ringlerr" },
      { label: "Channel", value: "Contextual calling" },
      { label: "Assets", value: "Rich media, analytics" },
    ],
    image: "/assets/products/contextual-ringlerr.webp",
    imageAlt: "160K Ringlerr contextual calling interface",
    href: "/products/contextual-communication",
  },
  {
    slug: "roaming-simcard",
    name: "Roaming SIM Card",
    summary:
      "Holiday SIM cards that operate on more than one network. Global coverage, high speed 4G, plug and play, with no setup or registration required.",
    meta: [
      { label: "Product", value: "Holiday SIM" },
      { label: "Network", value: "4G" },
      { label: "Setup", value: "None required" },
    ],
    image: "/assets/products/roaming-sim.webp",
    imageAlt: "160K holiday SIM card",
    href: "/products/roaming-simcard",
  },
];

/** The capability strip. Categories only — no invented services. */
export const capabilities = [
  "A2P Messaging",
  "OTP",
  "Targeted SMS",
  "Location Based Advertising",
  "Contextual Communication",
  "Roaming SIM",
] as const;

/**
 * From the public A2P page. Subscriber figures as published by 160K,
 * used verbatim so no new statistic is introduced.
 */
export const marketData = {
  penetration: [
    { year: "2010", value: "38.05%" },
    { year: "2020", value: "67.16%" },
  ],
  operators: [
    { name: "Telkomsel", subscribers: "169 million", image: "/assets/operators/telkomsel.webp" },
    { name: "Indosat", subscribers: "60 million", image: "/assets/operators/indosat.webp" },
    { name: "XL", subscribers: "57 million", image: "/assets/operators/xl.webp" },
    { name: "Tri", subscribers: "44 million", image: "/assets/operators/tri.webp" },
    { name: "Smartfren", subscribers: "26 million", image: "/assets/operators/smartfren.webp" },
  ],
  total: "356 million",
} as const;

/** The three published company principles. Not a sequence — no numbering. */
export const pillars = [
  {
    keyword: "Cost efficiency",
    body: "We help enterprises increase cost efficiencies with minimal investment.",
    image: "/assets/company/pillar-efficiency.webp",
  },
  {
    keyword: "Quality",
    body: "Our company was built with an emphasis to deliver high quality services to our customers.",
    image: "/assets/company/pillar-quality.webp",
  },
  {
    keyword: "Simplicity",
    body: "We have simple APIs and overlays that work with customers' existing systems.",
    image: "/assets/company/pillar-simplicity.webp",
  },
] as const;

export const vision = "To digitalize Indonesia and be the first Indonesian Cloud Communication unicorn";
export const mission = "From Indonesia, By Indonesia, For Indonesia";

/**
 * Technical facts from the official specification:
 * "TKDI - SMS Gateway - SMPP Interface", revision 1.0, 4 May 2016.
 * Field values are taken from the spec's connection details table.
 */
export const smpp = {
  title: "TKDI - SMS Gateway - SMPP Interface",
  revision: "1.0",
  date: "4 May 2016",
  version: "3.4",
  systemType: "Sms",
  enquireLink: "60 seconds",
  maxBind: "2",
  docHref: "/assets/docs/TKDI-SMS-Gateway-SMPP-Interface-v1.0.pdf",
  connection: [
    { field: "Protocol", value: "SMPP v3.4" },
    { field: "Bind type", value: "Transceiver (TRx), Transmitter (Tx), Receiver (Rx)" },
    { field: "System type", value: "Sms" },
    { field: "Enquire link", value: "60 seconds" },
    { field: "Source TON", value: "1 International / 2 National / 5 Alphanumeric" },
    { field: "Source NPI", value: "0 Unknown / 1 E.164 ISDN" },
    { field: "Destination TON", value: "1 International" },
    { field: "Destination NPI", value: "1 E.164 ISDN" },
    { field: "Max allowed bind", value: "2" },
  ],
  /** Real error codes published in the spec's error table. */
  errors: [
    { code: "000", text: "No error" },
    { code: "001", text: "Absent subscriber" },
    { code: "004", text: "Equipment not equipped with short-message capability" },
    { code: "005", text: "Unknown subscriber" },
    { code: "013", text: "Data missing" },
    { code: "014", text: "Unexpected data value" },
    { code: "042", text: "Invalid message service type" },
    { code: "050", text: "SMS rejected due to congestion" },
    { code: "051", text: "SMS malformed" },
    { code: "052", text: "SMS expired" },
    { code: "055", text: "Unable to find outbound route" },
    { code: "058", text: "Throttling error — message limit exceeded" },
  ],
  /**
   * A representative exchange. Field names and values follow the spec;
   * the message body is the example published on the 160K OTP page.
   * Connection host and credentials are intentionally omitted.
   */
  transcript: [
    { dir: "esme", name: "bind_transceiver", detail: "system_type: Sms · interface_version: 54" },
    { dir: "smsc", name: "bind_transceiver_resp", detail: "command_status: 0 · system_id: 160K", status: "ok" },
    { dir: "esme", name: "submit_sm", detail: "source_addr_ton: 1 · source_addr_npi: 1" },
    {
      dir: "smsc",
      name: "deliver_sm",
      detail: "err_cd: 000 · message_state: DELIVRD",
      status: "ok",
    },
  ],
} as const;

/**
 * Long-form copy for the product pages, taken from each product's own page on
 * 160k.co.id and lightly tightened. Nothing here is newly claimed.
 */
export type ProductDetail = {
  headline: string;
  intro: string;
  points: { title: string; body: string }[];
  /** Optional labelled block, e.g. a worked example. */
  example?: { label: string; lines: string[]; note?: string };
  gallery?: { src: string; alt: string }[];
  /** Links to a factual sub-section rendered on the page. */
  showMarketData?: boolean;
};

export const productDetails: Record<string, ProductDetail> = {
  "a2p-messaging": {
    headline: "Enterprise and wholesale A2P messaging",
    intro:
      "A2P messaging — also known as enterprise or business SMS — is a technique where text is sent from a software application to a consumer's device. It is the baseline channel that most businesses reach customers on.",
    points: [
      {
        title: "Who uses it",
        body: "Industries that have adopted A2P technology include e-commerce, banking, telecom, travel, social media and ride hailing.",
      },
      {
        title: "Two-factor authentication",
        body: "Send a one-time password to the user's mobile device to increase security at sign-in.",
      },
      {
        title: "Transaction and billing",
        body: "Credit card transaction and billing information, delivered directly to the customer.",
      },
      {
        title: "Marketing campaigns",
        body: "Promotional campaigns such as an e-commerce Harbolnas event, broadcast to a defined audience.",
      },
    ],
    showMarketData: true,
  },

  "otp-solution": {
    headline: "One-time passwords that actually arrive",
    intro:
      "160K delivers one-time passwords over two channels that work even when the device cannot receive a normal SMS: a flash call, and WhatsApp.",
    points: [
      {
        title: "Flash call",
        body: "The user receives a missed call from a random number. The OTP is the last 4–6 digits of that missed-call number, so nothing is written into a message body.",
      },
      {
        title: "WhatsApp",
        body: "Send the one-time pin into the user's mobile device over WhatsApp. Message content is not altered in transit.",
      },
    ],
    example: {
      label: "Flash call",
      lines: ["+6289539956", "1088", "The OTP is"],
      note: "The code is the final digits of the missed-call number.",
    },
    gallery: [
      {
        src: "/assets/products/otp-whatsapp-privy.webp",
        alt: "WhatsApp one-time password message from 160K",
      },
    ],
  },

  "location-based-advertising": {
    headline: "Advertising that knows where the customer is",
    intro:
      "Location Based Advertising sends information and campaigns to your target audience according to their geographical location.",
    points: [
      {
        title: "Pinpoint the audience",
        body: "The technology pinpoints the audience's location and provides accurate, location-specific information to their mobile device.",
      },
      {
        title: "Measurable by design",
        body: "160K describes LBA as one of the most accurate and accountable campaign methods available, because the target is defined by location rather than by inference.",
      },
    ],
  },

  "targeted-sms": {
    headline: "Campaigns matched to a customer profile",
    intro:
      "Define the customer profile that suits your business, then build campaigns that match it in the form of text or image.",
    points: [
      {
        title: "Profile attributes",
        body: "Age, sex, device operating system, religion, monthly usage and Average Revenue Per Unit (ARPU), hobby or interest — and more.",
      },
      {
        title: "Text or image",
        body: "Deliver the campaign as a text message or as an image, depending on the creative.",
      },
    ],
  },

  "contextual-communication": {
    headline: "The future of business calling",
    intro:
      "Ringlerr is a real-time consumer engagement solution offering a verified, trusted and branded calling experience to end users.",
    points: [
      {
        title: "The problem",
        body: "75% of your customers rarely or never answer calls from unknown numbers.",
      },
      {
        title: "Why calls get filtered",
        body: "Indonesia has been named the third-most spammed country in the world, and the most spammed market in Southeast Asia.",
      },
      {
        title: "Verified branded contextual calling",
        body: "A safer, trusted calling experience that helps enterprises achieve higher call and sales conversion.",
      },
      {
        title: "Rich media and analytics",
        body: "Support the call with rich media use cases, a dashboard and data analytics.",
      },
    ],
    gallery: [
      { src: "/assets/products/contextual-callup.webp", alt: "160K contextual calling interface" },
      { src: "/assets/products/contextual-ringlerr-alt.webp", alt: "Ringlerr branded calling screen" },
    ],
  },

  "roaming-simcard": {
    headline: "Holiday SIM cards, ready on arrival",
    intro:
      "Holiday SIM cards are mobile phone SIM cards that operate on more than one network, so a device stays connected while its owner is abroad.",
    points: [
      { title: "Global coverage", body: "Operates across more than one network." },
      { title: "High speed 4G", body: "A 4G connection rather than a fallback." },
      { title: "Plug and play", body: "No setup or registration required." },
      { title: "Save up to 80%", body: "On roaming data." },
    ],
  },
};

/** Signal path used by the hero and the architecture view. One continuous thread. */
export const signalPath = {
  inbound: ["Business applications", "E-commerce", "Banking", "Travel", "Enterprise"],
  core: "160K communication infrastructure",
  outbound: ["Messaging", "OTP", "Targeting", "Location", "Contextual calling"],
  endpoint: "Customer",
} as const;
