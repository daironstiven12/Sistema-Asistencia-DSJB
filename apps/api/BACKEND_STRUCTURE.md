# Estructura del backend

## apps/api
API HTTP del sistema (NestJS 12, JavaScript/CommonJS). Expone autenticación, usuarios y, a futuro, los módulos académicos y de asistencia. Persistencia con Prisma 7 sobre PostgreSQL (Supabase).

## src
Código de aplicación. `main.js` arranca Nest (helmet, cookies, validación global, CORS vía `config/app-config.js`). `app.module.js` registra los módulos y el rate limiting global vía `app-config.js`. `app.controller.js`/`app.service.js` son el endpoint base del scaffold. `config/app-config.js` es el único lector centralizado de entorno (valida y falla claro); `config/env.js` queda solo como helper numérico legacy. Arranque: `pnpm --filter api start` (`node index.js`) y `start:dev` (nodemon, misma base).

## src/modules
Módulos funcionales. Hoy existen `auth` (autenticación) y `users` (gestión de usuarios). Los módulos académicos futuros vivirán aquí con la misma separación por capas.

## auth
Autenticación: login, refresh con rotación, logout, revocación, firmas de sesión y auditoría. No contiene lógica académica.
- `domain`: políticas del dominio (contraseñas, sesiones, claims). Sin dependencias externas.
- `application`: casos de uso (`login-user`, `refresh-session`, `logout`, `revoke-user-sessions`) y errores internos.
- `application/ports`: contratos (hasher, emisor, sesiones, lector, auditoría). Los casos de uso solo conocen puertos.
- `infrastructure`: adaptadores concretos (Argon2, JWT, Prisma, cookies). Único lugar con librerías y entorno.
- `interfaces`: capa HTTP.
- `interfaces/http`: controllers, guards (`jwt-auth`, `roles`), decorador `Roles`, helper de metadatos de parámetros.
- `interfaces/http/dto`: validación de entradas (`LoginDto`).
- `tests`: unitarios por capa más config propia de jest (`jest.config.js`, transformer y stubs solo para tests).

## users
Gestión de usuarios, separada de autenticación: lectura mínima, cambio de contraseña, activación/desactivación/bloqueo y revocación asociada. Reutiliza adaptadores de `auth/infrastructure` (sin duplicar lógica). Estructura espejo de auth más `README.md` propio.

## prisma
- `prisma/schema.prisma`: modelos PostgreSQL vigentes (fuente de verdad).
- `prisma/schema.mysql.prisma`: copia histórica del esquema MySQL original. No se usa en runtime.
- `prisma/migrations/`: `0001_init`, `0002_auth_sessions`, `0003_auth_session_fk`. Solo se aplican con `migrate deploy` autorizado.
- `prisma7.config.ts`: rutas de schema/migraciones y URL del datasource para la CLI.
- `src/prisma/`: `PrismaModule` (global) y `PrismaService`. Los módulos NUNCA crean otro cliente: inyectan `PrismaService`.

## Configuración
- Prisma: `prisma7.config.ts` + `src/prisma/` (`prisma.service.js` valida `DATABASE_URL` vía `app-config.js`, sin hardcodear).
- Variables de entorno: solo `src/config/app-config.js` lee `process.env` y valida; `main.js`/`app.module.js`/`auth.controller.js`/`refresh-cookie.js`/`jwt-token-issuer.js` consumen esa configuración.
- JWT: `infrastructure/jwt-token-issuer.js` (`fromEnv` vía `getJwtConfig`; en prod exige issuer/audience y valida expiración al construir; secreto mínimo 32 chars).
- Argon2: `domain/password-policy.js` (defaults) + `infrastructure/argon2-password-hasher.js` (lee `PASSWORD_HASH_*` vía `getPasswordHashConfig`, Argon2id fijo).
- Sesiones: `domain/session-policy.js` + `prisma-session-store.js`; duración única en `infrastructure/auth-config.js` (`REFRESH_TOKEN_EXPIRES_IN`, 7d).
- NestJS: `app.module.js` (módulos, `ThrottlerModule`, `APP_GUARD`).
- Validación: `ValidationPipe` global en `main.js` (+ DTOs con `class-validator`).
- Seguridad HTTP: `main.js` (helmet, `cookie-parser`, CORS).
- Cookies: `infrastructure/refresh-cookie.js`.
- Rate limiting: `ThrottlerModule` global en `app.module.js` + `@Throttle` por ruta en controllers.

## Seguridad
- Hashing: `argon2-password-hasher.js` (Argon2id).
- JWT: `jwt-token-issuer.js` + `domain/token-claims.js`.
- Refresh opaco: `domain/session-policy.js` (generación SHA-256, familias).
- Sesiones: `prisma-session-store.js` + tabla `auth_sessions`.
- Cookies: `refresh-cookie.js` (HttpOnly, Secure en prod, `SameSite`, path `/auth`).
- Helmet/CORS/cookies/validación: `main.js`.
- Rate limiting: `app.module.js` + `@Throttle` en `auth.controller.js`.
- Validación: DTOs + `ValidationPipe`.
- Guards: `interfaces/http/guards/` (`JwtAuthGuard` 401, `RolesGuard` 403).
- Roles: `interfaces/http/roles.decorator.js` (`ADMINISTRADOR`, `DOCENTE`, `ESTUDIANTE`, `REPRESENTANTE`) con valores en `domain/roles.js`.
- Auditoría: `prisma-auth-audit.js` → tabla `audit_logs`.

## Base de datos
Prisma es la única vía de acceso a PostgreSQL. Modelos en `apps/api/prisma/schema.prisma`. Reglas: no crear clientes ad-hoc, no SQL fuera de migraciones, no tocar `schema.mysql.prisma` (histórico), migraciones solo autorizadas.

## Variables de entorno
Se cargan desde `.env` (nunca hardcodear) vía `src/config/app-config.js` (único lector centralizado; el resto no usa `process.env` disperso). Secretos (sin fallback, fallan claro al faltar): `JWT_ACCESS_SECRET`. Configuración con valor por defecto documentado: `PASSWORD_HASH_ALGORITHM` (argon2id), `PASSWORD_HASH_MEMORY_COST`/`TIME_COST`/`PARALLELISM` (65536/3/1), `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_EXPIRES_IN` (15m), `REFRESH_TOKEN_EXPIRES_IN` (7d), `COOKIE_SAMESITE` (lax), `COOKIE_SECURE` (vacío=auto), `COOKIE_DOMAIN` (vacío=host actual), `CORS_ORIGINS` (http://localhost:3000), `THROTTLE_TTL_MS`/`THROTTLE_LIMIT` (60000/100), `AUTH_LOGIN_LIMIT`/`AUTH_LOGIN_TTL_MS` (10/60000), `AUTH_REFRESH_LIMIT`/`AUTH_REFRESH_TTL_MS` (20/60000). Existentes: `DATABASE_URL`, `DIRECT_URL`, `PORT` (3001), `NODE_ENV`. Opcionales: `OBSERVE_APP_KEY`/`OBSERVE_APP_SECRET`/`OBSERVE_SERVICE_ID`. Sin valores reales en este documento. Plantilla: `.env.example`.

| Configuración | Variable | Archivo donde se consume |
|---|---|---|
| Hash Argon2id | `PASSWORD_HASH_ALGORITHM`, `PASSWORD_HASH_MEMORY_COST`, `PASSWORD_HASH_TIME_COST`, `PASSWORD_HASH_PARALLELISM` | `config/app-config.js` → `auth/infrastructure/argon2-password-hasher.js` |
| Secreto JWT | `JWT_ACCESS_SECRET` | `config/app-config.js` → `modules/auth/infrastructure/jwt-token-issuer.js` |
| Emisor/audiencia JWT | `JWT_ISSUER`, `JWT_AUDIENCE` | `config/app-config.js` → `modules/auth/infrastructure/jwt-token-issuer.js` |
| Duración access/refresh | `JWT_ACCESS_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` | `config/app-config.js` → `jwt-token-issuer.js`, `auth-config.js` |
| Cookies | `COOKIE_SAMESITE`, `COOKIE_SECURE`, `COOKIE_DOMAIN` (+`NODE_ENV`) | `config/app-config.js` → `modules/auth/infrastructure/refresh-cookie.js` |
| CORS | `CORS_ORIGINS` | `config/app-config.js` → `src/main.js` |
| Rate limiting | `THROTTLE_*`, `AUTH_LOGIN_*`, `AUTH_REFRESH_*` | `config/app-config.js` → `src/app.module.js`, `auth.controller.js` |
| Prisma CLI | `DIRECT_URL` | `prisma7.config.ts` |
| Prisma runtime | `DATABASE_URL` | `config/app-config.js` → `src/prisma/prisma.service.js` |
| Puerto/entorno | `PORT`, `NODE_ENV` | `config/app-config.js` → `src/main.js`, seguridad/cookies |
| Observabilidad | `OBSERVE_APP_KEY`, `OBSERVE_APP_SECRET`, `OBSERVE_SERVICE_ID` | `config/app-config.js` → `src/app.module.js` |
