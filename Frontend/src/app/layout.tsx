import type { Metadata, Viewport } from "next";
import {
  Anton,
  Archivo,
  Bodoni_Moda,
  Outfit,
  Plus_Jakarta_Sans,
  Inter,
  IBM_Plex_Mono,
} from "next/font/google";
import { AuthProvider } from "@/features/autenticacion";
import "./globals.css";

// Títulos, encabezados y cifras KPI: Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

// Texto general / UI: Inter
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Códigos, SKUs y consecutivos: IBM Plex Mono
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

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
  weight: ["400", "700"],
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

const scriptInicializacionTema = `
(function() {
  try {
    var d = document.documentElement;
    var paleta = localStorage.getItem('warengine-paleta') || 'zafiro';
    var fondo = localStorage.getItem('warengine-fondo') || 'malla';
    var tema = localStorage.getItem('warengine-tema') || 'dark';
    d.setAttribute('data-paleta', paleta);
    d.setAttribute('data-fondo', fondo);
    if (paleta === 'personalizada') {
      var varsRaw = localStorage.getItem('warengine-paleta-custom-vars');
      if (varsRaw) {
        var varsObj = JSON.parse(varsRaw);
        for (var k in varsObj) {
          if (Object.prototype.hasOwnProperty.call(varsObj, k)) {
            d.style.setProperty(k, varsObj[k]);
          }
        }
      }
    }
    if (tema === 'light') {
      d.classList.add('light');
      d.classList.remove('dark');
    } else {
      d.classList.add('dark');
      d.classList.remove('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      data-paleta="zafiro"
      data-fondo="malla"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable} ${ibmPlexMono.variable} ${anton.variable} ${archivo.variable} ${outfit.variable} ${bodoni.variable} dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptInicializacionTema }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text font-sans overflow-x-hidden selection:bg-brand-500 selection:text-btn-primario-texto">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

