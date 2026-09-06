import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Sal da Terra", template: "%s | Sal da Terra" }, description: "Gestão segura de participação e cuidado pastoral de adolescentes." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
