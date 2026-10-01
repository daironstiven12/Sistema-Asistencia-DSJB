# Módulo Users — Gestión de usuarios

Separado de Auth: aquí vive administración de cuentas, no autenticación.

Casos de uso: lectura mínima propia o de otro usuario si se es ADMINISTRADOR (`get-user`), cambio de contraseña propio o restablecimiento por ADMINISTRADOR (`change-password`, revoca todas las sesiones), activación/desactivación/bloqueo solo ADMINISTRADOR (`set-user-status`, revoca sesiones si deja de estar activo).

Endpoints (`JwtAuthGuard` siempre; `@Roles("ADMINISTRADOR")` donde aplica): `GET /users/:id`, `PATCH /users/:id/password`, `PATCH /users/:id/status`.

Respuestas mínimas: nunca incluyen `password_hash`. Acciones críticas auditan (`user.password_changed`, `user.activated`, `user.deactivated`, `user.blocked`) y revocan sesiones cuando corresponde.
