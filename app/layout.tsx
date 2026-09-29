import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Detector de Fake News — IA",
  description:
    "Chatbot para verificar se um conteúdo que circula na internet é verdadeiro ou não, com pesquisa na web e fontes citadas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
