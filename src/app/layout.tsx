import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIAN",
  description: "Contabilidad y expedientes — estudio VIAN",
};

// Fija data-theme antes del primer pintado para evitar parpadeo de tema.
const themeInit = `(function(){try{var t=localStorage.getItem('vian_theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
