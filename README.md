# VIAN

App interna de contabilidad y expedientes del estudio VIAN (Ana y Jorge).
Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL (Supabase) · CSS Modules.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
```

Requiere un `.env` con la conexión a la BD de **desarrollo** (Supabase `vian-dev`):

```
DATABASE_URL="postgresql://postgres.<ref>:<pwd>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<pwd>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

Ver `.env.example`. Regla de oro: **`DATABASE_URL` = puerto 6543** (`?pgbouncer=true`, lo usa la app);
**`DIRECT_URL` = puerto 5432** (lo usan las migraciones). Nunca migrar por el 6543.

## Base de datos

- **Esquema**: `prisma/schema.prisma`. Datos de muestra: `prisma/seed.ts`.
- Crear/editar migración en dev: `npx prisma migrate dev --name <nombre>`.
- Sembrar dev con datos de muestra: `npm run seed`.
- Reset completo de dev (destructivo): `npm run db:reset`.

## Entornos

Entorno único de **producción**: Supabase `vian-prod` (eu-west-1) desplegado en
Vercel. El proyecto de desarrollo `vian-dev` fue retirado.

Para pruebas locales puntuales, crea un proyecto Supabase temporal, pon sus
cadenas en `.env` y opcionalmente `npm run seed` (datos de muestra) — nunca
apuntes el `.env` local a producción.

## Despliegue (Vercel)

- Vercel está conectado al repo `mengominola/vian` (rama `main`): cada push despliega.
- Build: `prisma generate && next build`. **El build NO aplica migraciones** (para no
  depender de la BD ni colgarse en el pooler).
- Variables de entorno en Vercel: `DATABASE_URL` (6543) y `DIRECT_URL` (5432) de **prod**.

### Aplicar migraciones a producción

Cuando cambies el esquema y la migración esté en `main`:

1. Crea `vian/.env.prod` (ignorado por git) con `DATABASE_URL` y `DIRECT_URL` de **vian-prod**.
2. Ejecuta:

   ```bash
   npm run migrate:prod
   ```

   Aplica las migraciones pendientes por `DIRECT_URL` (5432). Es idempotente.

## Estado

Hecho: modelo de datos, las 5 pantallas + hoja A4, migración a Supabase/Vercel,
autenticación (Ana/Jorge) y carga de datos reales en producción. Presupuestos
(quotes): descartado.
