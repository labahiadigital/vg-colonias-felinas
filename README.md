# Gestión de Colonias Felinas Urbanas — SaaS Multi-tenant

Plataforma SaaS responsive para la gestión integral de colonias felinas urbanas, diseñada para ayuntamientos, diputaciones, asociaciones protectoras y entidades gestoras.

**Versión:** 2.0.0-saas
**Expediente inicial:** 2026/CO_ASUM/0013 (Vitoria-Gasteiz)

## Arquitectura SaaS

| Aspecto | Decisión |
|---|---|
| **Multi-tenancy** | Aislamiento por `organizationId` en todas las tablas |
| **Onboarding** | Registro de organización + primer administrador |
| **Planes** | Standard (50 usuarios), Professional (ilimitados, SMTP propio), Enterprise (on-premise) |
| **Cartografía** | OpenStreetMap (libre, abierto, sin costes de licencia) |
| **WCAG** | 2.1 AA |
| **Navegadores** | Últimas 2 versiones de Chrome, Firefox, Safari, Edge |
| **RPO / RTO** | < 24h / < 4h |
| **Disponibilidad** | 99,5% mensual |

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | SvelteKit 5 + TypeScript |
| CSS | Tailwind CSS 4 |
| Base de datos | PostgreSQL (Neon, UE) |
| ORM | Drizzle ORM |
| Autenticación | Better Auth (rate limited, min 8 chars) |
| Mapas | Leaflet + Leaflet Draw + OpenStreetMap |
| Email | SMTP genérico (configurable por organización) |
| Idiomas | ES (Castellano) + EU (Euskera) |
| Validación | Zod |

## Módulos Funcionales

### 1. Dashboard
KPIs en tiempo real, actividad reciente, accesos rápidos a todos los módulos.

### 2. Cartografía y Geolocalización
- Mapa interactivo con capas editables (colonias, puntos de alimentación, incidencias, zonas críticas/sensibles/campeo).
- **Leaflet Draw** para crear/editar polígonos, líneas y puntos con exportación GeoJSON.
- Filtros por estado y distrito. Geolocalización automática desde móvil.

### 3. Gestión de Colonias
CRUD completo, ficha detallada con geolocalización, asociación con gatos/incidencias/CER, historial de auditoría, confirmación para acciones destructivas.

### 4. Censo Individual de Gatos
Ficha con **fotografía** (subida directa + cámara móvil), sexo, microchip, estado, historial sanitario, CER, adopciones. Certificados generables desde ficha.

### 5. Salud Animal
Vacunación, esterilización, desparasitación, microchip, cirugía, revisión. Vinculación con gato/colonia. Identificación veterinario/clínica.

### 6. Programa CER
Captura-Esterilización-Retorno. Relación animal/colonia. Indicadores por fases.

### 7. Incidencias y Quejas
Geolocalización automática, categorización, prioridad, asignación de responsable con **notificación automática**, historial de comentarios, **adjuntar fotografías**.

### 8. Inspecciones
**Plantillas configurables** de inspección (JSON schema). Formulario móvil con evaluación rápida. Resultados estructurados.

### 9. Colaboradores
Registro/aprobación, **credencial digital con QR verificable** (hash SHA-256), verificación pública vía `/api/verificar/[hash]`, gestión LOPD, notificaciones de cambio de estado.

### 10. Adopciones
Flujo completo con cambio automático de estado del gato. Consentimiento informado. Notificaciones.

### 11. Comunicaciones
Chat interno con carga en tiempo real. Notificaciones por canal interno + **email** (SMTP configurable).

### 12. Informes e Indicadores
KPIs, gráficos, exportación CSV por entidad, exportación PDF, **exportación completa** (JSON/CSV de toda la BD).

### 13. Configuración y Administración
- Perfil y preferencias de usuario.
- **RBAC**: gestión de usuarios, roles personalizados, matriz de permisos (11 módulos × 10 acciones = 110 permisos base).
- **Catálogos** configurables bilingües.
- **Plantillas de inspección** (JSON schema editor).
- **Plantillas de certificado** (HTML personalizable).
- **Plantillas de email** (variables: `{{nombre}}`, `{{estado}}`, `{{enlace}}`).
- **Políticas de retención** de datos (por entidad, con acciones: anonimizar/eliminar/archivar).
- **Importación CSV** (colonias, gatos, colaboradores, incidencias, salud).
- **Exportación completa** de datos (reversibilidad).
- Registro de auditoría.

## Subida de Archivos

- Endpoint `/api/upload` con validación MIME (JPEG, PNG, WebP, GIF, PDF, XLSX, DOCX).
- Tamaño máximo: 10MB.
- Componente `FileUpload.svelte` con preview y captura desde cámara (`capture="environment"`).
- Integrado en gatos, incidencias.

## Certificados Oficiales

Tres tipos generables desde la ficha del gato: Sanitario, Esterilización, CER.
HTML imprimible con número de certificado único, datos completos, espacio para firma.
**Plantillas personalizables** por organización desde Configuración.

## Credenciales Verificables

- Hash SHA-256 único por colaborador.
- QR real generado vía API (qrserver.com).
- Endpoint público `/api/verificar/[hash]` para verificación sin autenticación.
- Página de verificación con estado visual (válido/inválido).

## Notificaciones Automáticas

Se generan al:
- Cambiar estado de incidencia, adopción o colaborador.
- Asignar responsable de incidencia.

Canal dual: **interno** (BD) + **email** (si SMTP configurado).

## RBAC

| Rol | Descripción |
|---|---|
| `admin` | Administrador — acceso total |
| `tecnico` | Personal técnico |
| `veterinario` | Personal veterinario |
| `entidad_gestora` | Entidad coordinadora |
| `colaborador` | Persona colaboradora |

Permisos: `view`, `create`, `edit`, `validate`, `close`, `export`, `admin`, `access_personal_data`, `access_health_data`, `access_geo_sensitive`.

## Seguridad

- Better Auth: bcrypt, sesiones JWT (7 días), rate limiting (10/min).
- Contraseñas: mín. 8, máx. 128 caracteres.
- Cabeceras HTTP: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Cifrado TLS en tránsito, AES-256 en reposo (Neon).
- RBAC con principio de mínimo privilegio.
- Auditoría completa de todas las acciones.
- Validación MIME + tamaño en uploads.
- Acciones destructivas con confirmación.

## RGPD / Protección de Datos

- Datos en UE (Neon PostgreSQL).
- Sin transferencias internacionales.
- Políticas de retención configurables por entidad.
- Información de privacidad para colaboradores (firma digital).
- Derechos de acceso, rectificación, supresión, portabilidad.
- Separación de datos personales y operativos.
- Páginas legales: `/privacidad`, `/terminos`.

## Accesibilidad (WCAG 2.1 AA)

- Skip navigation.
- Focus visible en todos los controles.
- `aria-label` en navegación y diálogos.
- `role` y `aria-modal` en diálogos de confirmación.
- Contraste adecuado.
- Formularios con labels asociados.

## Internacionalización

ES (Castellano) + EU (Euskera) en igualdad. Claves en `src/lib/i18n/`. Catálogos bilingües.

## Configuración Local

### Requisitos
- Node.js 20+
- Cuenta en [Neon](https://neon.tech) (PostgreSQL EU)

### Instalación
```bash
cd responsive-web-app-for-vitoria-gasteiz-urban-feline-colonies-management
npm install
```

### Variables de Entorno
```
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
BETTER_AUTH_SECRET=clave-secreta-segura-minimo-32-caracteres
BETTER_AUTH_URL=http://localhost:5173
SMTP_HOST=smtp.example.com       # Opcional
SMTP_PORT=587                     # Opcional
SMTP_USER=user@example.com       # Opcional
SMTP_PASS=password                # Opcional
SMTP_FROM=noreply@example.com    # Opcional
```

### Migración
```bash
npx drizzle-kit push
```

### Seed Demo
```bash
curl -X POST "http://localhost:5173/api/seed?key=seed-2026-vg"
```

### Desarrollo
```bash
npm run dev
```

### Credenciales Demo

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@vitoria-gasteiz.org | Admin2026! |
| Técnico | tecnico@vitoria-gasteiz.org | Tecnico2026! |
| Veterinario | vet@vitoria-gasteiz.org | Vet2026! |
| Entidad Gestora | gestor@vitoria-gasteiz.org | Gestor2026! |
| Colaborador | colaborador@vitoria-gasteiz.org | Colab2026! |

## API Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/auth/[...all]` | * | Better Auth |
| `/api/seed` | POST | Seed demo (key=seed-2026-vg) |
| `/api/set-locale` | POST | Cambiar idioma |
| `/api/messages/[conversationId]` | GET | Mensajes de conversación |
| `/api/upload` | POST | Subida de archivos (multipart) |
| `/api/export-excel` | GET | Export CSV por entidad |
| `/api/export-pdf` | GET | Informe general PDF |
| `/api/export-full` | GET | Exportación completa (JSON/CSV) |
| `/api/import` | POST | Importación CSV |
| `/api/credencial/[id]` | GET | Credencial digital (QR) |
| `/api/certificado/[catId]` | GET | Certificados (health/sterilization/cer) |
| `/api/verificar/[hash]` | GET | Verificación pública de credencial |

## Estructura del Proyecto

```
src/
├── lib/
│   ├── i18n/                  # ES + EU
│   ├── server/
│   │   ├── db/schema.ts       # Multi-tenant schema (organizations + all entities)
│   │   ├── auth/              # Better Auth (rate limit, password policy)
│   │   ├── audit.ts           # Auditoría
│   │   ├── rbac.ts            # RBAC helpers
│   │   ├── notifications.ts   # Notificaciones (interno + email)
│   │   └── email.ts           # SMTP genérico (org-level)
│   ├── auth-client.ts
│   └── components/
│       ├── layout/            # Sidebar, Header
│       └── ui/                # ConfirmDialog, FileUpload
├── routes/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── registro/          # Onboarding SaaS
│   │   ├── recuperar-contrasena/
│   │   ├── privacidad/
│   │   └── terminos/
│   ├── (app)/                 # Módulos protegidos
│   │   ├── dashboard/
│   │   ├── mapa/              # Leaflet + Leaflet Draw
│   │   ├── colonias/          # Lista + [id]
│   │   ├── gatos/             # Lista + [id] + certificados
│   │   ├── salud/
│   │   ├── cer/
│   │   ├── incidencias/
│   │   ├── inspecciones/
│   │   ├── colaboradores/     # Lista + [id] + credencial
│   │   ├── adopciones/
│   │   ├── mensajes/
│   │   ├── informes/
│   │   └── configuracion/     # RBAC, catálogos, plantillas, retention, import/export
│   └── api/
docs/
├── plan-migracion.md
├── plan-reversibilidad.md
├── estrategia-pruebas.md
├── plan-copias-seguridad.md
├── modelo-seguridad.md
└── proteccion-datos.md
```

## Decisiones Técnicas Tomadas

Todas las decisiones previamente marcadas como "pendiente de confirmar" se han resuelto:

| Decisión | Resolución |
|---|---|
| Cartografía | OpenStreetMap (libre, sin coste) |
| WCAG | 2.1 AA |
| Navegadores | Chrome, Firefox, Safari, Edge (últimas 2 versiones) |
| RPO/RTO | < 24h / < 4h |
| Disponibilidad | 99,5% |
| Credencial digital | Hash SHA-256 + QR verificable públicamente |
| Firma electrónica | Hash de verificación (firma legal requiere proveedor certificado) |
| Notificaciones | Interno + email SMTP (SMS preparado como webhook futuro) |
| Retención datos operativos | 5 años (configurable por organización) |
| Retención colaboradores | 3 años post-baja (configurable) |
| Retención adoptantes | 5 años post-adopción (configurable) |
| Retención auditoría | 5 años (configurable) |
| Texto privacidad | Página `/privacidad` genérica adaptable |
| Plantillas certificados | Configurables por organización |
| Plantillas inspecciones | JSON schema, configurables |
| Plan de migración | Documentado en `docs/plan-migracion.md` |
| Reversibilidad | Endpoint `/api/export-full` + documentado |
| Importación | Endpoint `/api/import` para CSV |
| ENS | Categoría Básica (para aplicaciones municipales) |

## Elementos que Requieren Proveedor Externo

| Elemento | Nota |
|---|---|
| Firma electrónica cualificada | Requiere proveedor certificado (ej: Viafirma, Docusign) |
| SMS/Push | Requiere proveedor (ej: Twilio, AWS SNS) — preparado como webhook |
| Hosting producción | Recomendado: Vercel/Railway/Fly.io (UE) |
| Certificado HTTPS | Gestionado por hosting (Let's Encrypt) |
| Auditoría externa ENS | Requiere empresa auditora certificada |
