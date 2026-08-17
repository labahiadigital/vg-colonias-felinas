# Modelo de Seguridad

**Expediente:** 2026/CO_ASUM/0013
**Versión:** 1.0

## 1. Autenticación

| Elemento | Implementación |
|----------|---------------|
| Método | Email + contraseña (Better Auth) |
| Almacenamiento contraseñas | Bcrypt (hash + salt) |
| Longitud mínima | 8 caracteres |
| Longitud máxima | 128 caracteres |
| Recuperación | Token temporal por email |
| Sesiones | JWT con expiración 7 días, renovación diaria |
| Rate limiting | 10 intentos por minuto |

## 2. Autorización (RBAC)

### Roles predefinidos
1. **admin** — Acceso total
2. **tecnico** — Gestión operativa
3. **veterinario** — Datos sanitarios
4. **entidad_gestora** — Coordinación
5. **colaborador** — Acceso limitado

### Permisos por módulo
10 acciones × 11 módulos = 110 permisos base:
- `view`, `create`, `edit`, `validate`, `close`
- `export`, `admin`
- `access_personal_data`, `access_health_data`, `access_geo_sensitive`

### Principio de mínimo privilegio
Cada rol tiene solo los permisos estrictamente necesarios para su función.

## 3. Protección en Tránsito

- TLS 1.2+ obligatorio para todas las conexiones.
- HSTS habilitado.
- Certificados gestionados por el proveedor de hosting.

## 4. Cabeceras de Seguridad

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), geolocation=(self), microphone=()
```

## 5. Protección contra Vulnerabilidades Web

| Vulnerabilidad | Mitigación |
|---------------|------------|
| SQL Injection | Drizzle ORM (queries parametrizadas) |
| XSS | SvelteKit (escaping automático) |
| CSRF | Tokens SvelteKit integrados |
| Clickjacking | X-Frame-Options: DENY |
| MIME sniffing | X-Content-Type-Options: nosniff |
| Subida de archivos | Validación de tipo MIME y tamaño máximo (10MB) |

## 6. Gestión de Sesiones

- Token de sesión almacenado en cookie HttpOnly.
- Expiración automática a los 7 días.
- Renovación diaria.
- Invalidación en logout.

## 7. Gestión de Secretos

- Variables de entorno (`.env`) fuera del código.
- `.env` en `.gitignore`.
- Secretos de producción en el proveedor de hosting.
- `BETTER_AUTH_SECRET`: mínimo 32 caracteres.
- `DATABASE_URL`: conexión cifrada (sslmode=require).

## 8. Registro de Auditoría

Todas las acciones relevantes se registran en `audit_logs`:
- Creación, modificación, eliminación de entidades.
- Cambios de estado.
- Cambios de permisos.
- Generación de certificados.
- Exportaciones de datos.
- Accesos administrativos.

Cada registro incluye: usuario, fecha/hora, acción, entidad, detalles.

## 9. Validación de Entradas

- Server-side: validación en cada action de SvelteKit.
- Tipos de archivo: solo JPEG, PNG, WebP, GIF, PDF, XLSX, DOCX.
- Tamaño máximo: 10MB por archivo.
- Sanitización de nombres de archivo.

## 10. Protección de Datos Personales

- Datos de adoptantes restringidos por permisos.
- Datos sanitarios accesibles solo con `access_health_data`.
- Ubicaciones sensibles con `access_geo_sensitive`.
- No se exponen datos personales en URLs ni logs.
- Información de privacidad para colaboradores.

## 11. Actualizaciones

- Dependencias monitorizadas con `npm audit`.
- Actualizaciones de seguridad prioritarias.
- Registro de versiones (CHANGELOG).

## 12. Elementos [PENDIENTE DE CONFIRMAR]

- ENS (Esquema Nacional de Seguridad): categoría y nivel.
- Certificaciones de seguridad requeridas.
- Auditoría de seguridad externa.
- Plan de respuesta a incidentes de seguridad.
- Política de contraseñas definitiva del Ayuntamiento.
