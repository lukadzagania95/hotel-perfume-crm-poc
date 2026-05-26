import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOC Hotel Perfume CRM POC",
  description: "Internal MVP for hotel perfume sampling CRM workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/hotels" className="brand">
              HOC Hotel Perfume CRM
            </Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/hotels">Hotels</Link>
              <Link href="/emails/templates">Email Templates</Link>
              <Link href="/emails/logs">Email Log</Link>
            </nav>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
