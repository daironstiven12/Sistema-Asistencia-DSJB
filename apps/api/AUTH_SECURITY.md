# Seguridad de autenticación

## Contraseñas
- Las contraseñas NO se almacenan en texto plano.
- Utilizaremos Argon2id para generar el hash de las contraseñas.
- El hash almacenado será suficiente para que Argon2id pueda verificar posteriormente la contraseña.
- No utilizaremos MD5, SHA-1, SHA-256 ni otros hashes criptográficos simples para almacenar contraseñas.
- Nunca guardar ni registrar contraseñas originales.
- La contraseña nunca debe formar parte de un JWT, log, auditoría o respuesta de API.

## Access Token
- Será un JWT de corta duración.
- Su duración objetivo será de aproximadamente 10-15 minutos.
- Tendrá únicamente los claims necesarios para identificar al usuario y su contexto de autenticación.
- No incluir nombres, documentos de identidad, firmas, contraseñas ni información personal innecesaria.
- En producción `JWT_ISSUER` y `JWT_AUDIENCE` son obligatorios; en desarrollo usan valores explícitos no secretos. Una expiración inválida falla al inicializar, no en el primer login.

## Refresh Token
- NO será un JWT.
- Será un token opaco, aleatorio y criptográficamente seguro.
- Tendrá suficiente entropía para evitar predicción.
- El servidor almacenará únicamente un hash SHA-256 del refresh token.
- El token original no se almacenará en la base de datos.
- Se utilizará rotación de refresh tokens.
- Los refresh tokens pertenecerán a una familia mediante family_id.
- Un refresh token ya utilizado/reemplazado no podrá reutilizarse.
- La reutilización de un token rotado deberá permitir revocar la familia de sesión.
- La duración vive en una sola configuración (`REFRESH_TOKEN_EXPIRES_IN`, 7d): la usa `auth_sessions.expires_at` y la cookie `maxAge`.

## Sesiones
- La tabla auth_sessions será utilizada para controlar las sesiones.
- Se almacenará token_hash, family_id, expiración, revocación, IP y user agent cuando corresponda.
- Logout y revocación deberán invalidar la sesión correspondiente.
- Debe ser posible revocar todas las sesiones de un usuario.

## Cookies
- El refresh token viaja en la cookie `refresh_token` (path `/auth`), nunca en JSON.
- HttpOnly siempre; `Secure` solo en producción (`NODE_ENV=production`) para no romper HTTP local.
- `SameSite` por defecto `lax`, configurable con `COOKIE_SAMESITE`.
- Expiración igual a `REFRESH_TOKEN_EXPIRES_IN`. Al cerrar sesión se limpia con el mismo alcance.

## Protección HTTP
- Helmet para cabeceras de seguridad (`main.js`).
- CORS mediante allowlist explícita (`CORS_ORIGINS`, coma-separada; por defecto `http://localhost:3000`) con credenciales. Sin `origin: "*"`.
- Rate limiting: global generoso (`THROTTLE_LIMIT`/`THROTTLE_TTL_MS`) más `@Throttle` estricto en login (10/min) y refresh (20/min) configurables por entorno. Los números se validan con `src/config/env.js` (falla claro ante valores inválidos).
- Validación estricta de datos de entrada (`ValidationPipe` global + DTOs).

## Auditoría
Los eventos importantes de autenticación deberán registrarse posteriormente en audit_logs, por ejemplo:
- login exitoso
- intento de login fallido
- logout
- refresh
- revocación de sesión
- reutilización de refresh token
- bloqueo/desactivación de usuario

No registrar contraseñas, tokens originales ni información sensible innecesaria.

## Roles
Los roles existentes son:
- ADMINISTRADOR
- DOCENTE
- ESTUDIANTE
- REPRESENTANTE

Autorización con `RolesGuard` + `@Roles(...)`: 401 sin autenticación, 403 sin permiso. Implementados en `interfaces/http/guards/`. Los nombres de rol viven en `domain/roles.js` (misma fuente para guards, casos de uso y controller).

## Reglas de implementación
- No almacenar contraseñas en texto plano.
- No implementar criptografía propia.
- Utilizar librerías mantenidas y algoritmos estándar.
- No colocar secretos directamente en el código.
- Las variables sensibles deberán venir del entorno.
- No colocar datos personales innecesarios dentro de tokens.
- Las operaciones sensibles deberán quedar auditadas.

## Variables de entorno
Nombres reales utilizados por el código (ver tabla en `BACKEND_STRUCTURE.md`). Sin valores reales aquí.

Secretos (sin fallback; el arranque falla claro si faltan):
- `JWT_ACCESS_SECRET`: firma y verifica access tokens (`jwt-token-issuer.js`). Solo entorno, nunca Git. Generación local: `openssl rand -hex 32` (un secreto distinto por entorno; ejecutar y pegar el resultado, sin guardarlo en archivos).

Configuración (con valor por defecto documentado en código):
- `PASSWORD_HASH_ALGORITHM` (argon2id, único permitido), `PASSWORD_HASH_MEMORY_COST` (65536), `PASSWORD_HASH_TIME_COST` (3), `PASSWORD_HASH_PARALLELISM` (1): Argon2id (`argon2-password-hasher.js` vía `src/config/app-config.js`).
- `JWT_ISSUER`, `JWT_AUDIENCE`: emisor/audiencia (`jwt-token-issuer.js` vía `app-config.js`); obligatorios en producción, valores explícitos de desarrollo en local.
- `JWT_ACCESS_EXPIRES_IN` (15m), `REFRESH_TOKEN_EXPIRES_IN` (7d): duraciones; formato validado al inicializar.
- `COOKIE_SAMESITE` (lax), `COOKIE_SECURE` (vacío=automático: true en prod o SameSite=none), `COOKIE_DOMAIN` (vacío=host actual), `CORS_ORIGINS` (coma-separada), `THROTTLE_TTL_MS`/`THROTTLE_LIMIT`, `AUTH_LOGIN_LIMIT`/`AUTH_LOGIN_TTL_MS`, `AUTH_REFRESH_LIMIT`/`AUTH_REFRESH_TTL_MS`, `NODE_ENV`, `PORT` (3001).
- `DATABASE_URL` (pooler, runtime), `DIRECT_URL` (directa, solo CLI/migraciones).
- `OBSERVE_APP_KEY`/`OBSERVE_APP_SECRET`/`OBSERVE_SERVICE_ID` (opcionales, vacíos por defecto; sin secretos hardcodeados).

La plantilla versionable es `apps/api/.env.example` (placeholders, sin secretos). El `.env` real está ignorado por Git y nunca se modifica desde el código.
