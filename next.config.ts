import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  compress: true,
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const scriptSrc = isProduction
      ? "script-src 'self' 'unsafe-inline';"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval';";
    const csp = [
      "default-src 'self';",
      scriptSrc,
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: https:;",
      "font-src 'self';",
      "connect-src 'self' https://generativelanguage.googleapis.com;",
      "object-src 'none';",
      "base-uri 'self';",
      "frame-ancestors 'none';",
    ].join(" ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);