import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/features/autenticacion";
import "./globals.css";

// Fuentes ejecutivas del sistema de diseño (variables CSS locales para builds offline y rendimiento)
const plusJakartaSans = { variable: "font-plus-jakarta" };
const inter = { variable: "font-inter" };
const ibmPlexMono = { variable: "font-ibm-plex-mono" };
const anton = { variable: "font-anton" };
const archivo = { variable: "font-archivo" };
const outfit = { variable: "font-ui" };
const bodoni = { variable: "font-bodoni" };

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

