import type { Metadata } from "next";
import Link from "next/link";
import { getEmailSettings } from "@/lib/emailTransport";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOC Hotel Perfume CRM",
  description: "Hotel perfume sampling operations and email automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const emailSettings = getEmailSettings();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand">
              HOC Hotel Perfume CRM
            </Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/">Dashboard</Link>
              <Link href="/hotels">Hotels</Link>
              <Link href="/emails/templates">Email Templates</Link>
              <Link href="/emails/logs">Email Log</Link>
              <Link href="/emails/incoming">Incoming Emails</Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="nav-signout">Sign out</button>
              </form>
            </nav>
          </header>
          <div className={`environment-banner ${emailSettings.mode}`} role="status">
            <strong>{emailSettings.mode === "test" ? "TEST MODE" : "LIVE MODE"}</strong>
            <span>
              {emailSettings.mode === "test"
                ? "All outbound email is redirected to the configured test inbox."
                : "Outbound email is delivered to each hotel's contact address."}
            </span>
          </div>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
