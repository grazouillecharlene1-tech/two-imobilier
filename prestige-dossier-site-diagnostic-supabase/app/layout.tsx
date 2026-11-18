import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Prestige Bâtiment & Immobilier",
  description: "Construction, architecture et étude de dossiers techniques.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
