import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// La app en producción solo es accesible por este dominio.
// Cualquier otro host (los *.vercel.app de producción o preview) se redirige aquí,
// de modo que no haya una vía alternativa de entrada.
const CANONICAL = "gestion.vianestudio.com";

export function proxy(req: NextRequest) {
  const hostname = (req.headers.get("host") || "").split(":")[0].toLowerCase();

  // Desarrollo local (sandbox vian-dev) — no afecta a producción.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return NextResponse.next();
  }
  // Dominio canónico: pasa.
  if (hostname === CANONICAL) {
    return NextResponse.next();
  }
  // Cualquier otro host (vercel.app, previews, IP…): al dominio canónico.
  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Se ejecuta en todas las rutas excepto estáticos de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
