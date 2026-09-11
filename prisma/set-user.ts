/**
 * Crea o actualiza un usuario (socio) con contraseña hasheada.
 *
 * Uso (dev, usa .env):
 *   npm run user:set -- <email> <password> "<Nombre>" <ana|jorge>
 *
 * Para PROD: crea vian/.env.prod y ejecuta con esas credenciales, p. ej.:
 *   npm run user:set:prod -- <email> <password> "<Nombre>" <ana|jorge>
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Si se pasa --prod (o USE_ENV_PROD=1), carga credenciales de .env.prod.
if (process.argv.includes("--prod") || process.env.USE_ENV_PROD === "1") {
  const p = path.join(process.cwd(), ".env.prod");
  if (!fs.existsSync(p)) {
    console.error("✖ Falta .env.prod");
    process.exit(1);
  }
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(DATABASE_URL|DIRECT_URL)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/\r$/, "");
  }
}

const args = process.argv.slice(2).filter((a) => a !== "--prod");
const [email, password, nombre, socio] = args;

if (!email || !password || !nombre || !socio) {
  console.error('Uso: npm run user:set -- <email> <password> "<Nombre>" <ana|jorge>');
  process.exit(1);
}
if (socio !== "ana" && socio !== "jorge") {
  console.error("✖ socio debe ser 'ana' o 'jorge'");
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 10);
  const em = email.trim().toLowerCase();
  await prisma.user.upsert({
    where: { email: em },
    update: { passwordHash, nombre, socio },
    create: { email: em, passwordHash, nombre, socio },
  });
  console.log(`✔ Usuario guardado: ${em} (${socio})`);
  await prisma.$disconnect();
}
main();
