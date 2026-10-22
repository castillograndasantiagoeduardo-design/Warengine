import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Pixelify_Sans, Bodoni_Moda } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const archivo = Archivo({
  weight: ["900"],
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const pixelify = Pixelify_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WarEngine — Administración, Ventas & Logística a otro nivel",
  description:
    "Sistema ERP / POS multi-sucursal para cadenas comerciales, inventario multi-almacén y facturación electrónica.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${archivo.variable} ${pixelify.variable} ${bodoni.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0d1630] text-white overflow-x-hidden selection:bg-[#e3b341] selection:text-black">
        {children}
      </body>
    </html>
  );
}

