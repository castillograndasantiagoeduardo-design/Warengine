import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Bodoni_Moda, Outfit } from "next/font/google";
import { AuthProvider } from "@/features/autenticacion";
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

// Fuente base de toda la interfaz (sans geométrica), login incluido.
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-ui",
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
      className={`${anton.variable} ${archivo.variable} ${outfit.variable} ${bodoni.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0d1630] text-white overflow-x-hidden selection:bg-[#e3b341] selection:text-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

