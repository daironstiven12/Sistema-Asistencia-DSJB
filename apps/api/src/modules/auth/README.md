# Módulo Auth — Capas

## domain
Reglas y políticas propias del dominio de autenticación: vigencia de tokens, rotación y revocación de sesiones, política de contraseñas y claims permitidos. Sin dependencias de NestJS, Prisma ni HTTP.

## application
Casos de uso (registro, login, refresh, logout, revocación) y puertos (interfaces de hash, emisión de tokens, sesiones, auditoría y lectura de usuarios). Los casos de uso solo conocen puertos, nunca implementaciones.

## infrastructure
Implementaciones concretas de los puertos: Argon2, JWT, Prisma (sesiones, usuarios, auditoría) y almacenamiento de sesiones. Aquí viven los adaptadores.

## interfaces/http
Punto de entrada HTTP: controllers, DTOs con validación, guards (autenticación y roles) y decoradores. Traduce HTTP a casos de uso y viceversa, sin lógica de negocio.
