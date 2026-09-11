/**
 * Aplica las migraciones de Prisma a PRODUCCIÓN (Supabase vian-prod).
 *
 * Uso:  npm run migrate:prod
 *
 * Lee las credenciales de `vian/.env.prod` (fichero IGNORADO por git; créalo con
 * las líneas DATABASE_URL y DIRECT_URL del proyecto prod). Las migraciones se
 * aplican por `DIRECT_URL` (puerto 5432): NUNCA por el pooler de transacción 6543,
 * que cuelga los locks de sesión que necesita `migrate deploy`.
 *
 * El build de Vercel NO ejecuta migraciones (solo `prisma generate && next build`),
 * así que ejecuta este script a mano cuando cambies el esquema y ya lo tengas en
 * `main`/desplegado.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const envPath = path.join(process.cwd(), ".env.prod");
if (!fs.existsSync(envPath)) {
  console.error("✖ Falta vian/.env.prod. Crea el fichero con DATABASE_URL y DIRECT_URL de vian-prod.");
  process.exit(1);
}

const txt = fs.readFileSync(envPath, "utf8");
for (const line of txt.split(/\r?\n/)) {
  const m = line.match(/^\s*(DATABASE_URL|DIRECT_URL)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/\r$/, "");
}

const direct = process.env.DIRECT_URL || "";
if (/:6543\b/.test(direct)) {
  console.error("✖ DIRECT_URL apunta al puerto 6543 (pooler de transacción). Debe ser el 5432 (conexión de sesión).");
  process.exit(1);
}
const host = (direct.split("@")[1] || "").split("/")[0] || "(desconocido)";
console.log(`Aplicando migraciones a prod por DIRECT_URL host=${host}`);

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
