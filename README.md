# Gatopolis — Donde cada gato cuenta

Plataforma SaaS responsive para la gestión integral de colonias felinas urbanas, diseñada para ayuntamientos, diputaciones, asociaciones protectoras y entidades gestoras de toda Europa.

**Versión:** 3.0.0-saas-eu
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
| **ENS** | Categoría Media (MFA/TOTP, rotación contraseñas, plan de incidentes) |

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | SvelteKit 5 + TypeScript |
| CSS | Tailwind CSS 4 |
| Base de datos | PostgreSQL (Neon Serverless, UE) |
| ORM | Drizzle ORM |
| Autenticación | Better Auth (bcrypt, rate limiting, MFA/TOTP, rotación contraseñas) |
| Mapas | Leaflet + Leaflet Draw + Leaflet.heat + OpenStreetMap |
| Email | SMTP genérico (configurable por organización) |
| Idiomas | ES, EU, EN, CA, GL, PT, IT, FR (8 idiomas) |
| Validación | Zod |
| Testing | Vitest + @testing-library/svelte + Playwright E2E |
| PWA | Service Worker + IndexedDB (offline queue) |
| Push | Web Push API (VAPID) + fallback email |
| IA | OpenAI Vision (identificación felina) |

## Módulos Funcionales (23+)

### 1. Dashboard
KPIs en tiempo real, actividad reciente, accesos rápidos, **panel de indicadores ODS** (ODS 3, 11, 15, 16) con métricas de impacto.

### 2. Cartografía y Geolocalización
- Mapa interactivo con capas editables (colonias, puntos de alimentación, incidencias, zonas críticas/sensibles/campeo).
- **Leaflet Draw** para crear/editar polígonos, líneas y puntos con exportación GeoJSON.
- **Mapas de calor (Heatmaps)** con Leaflet.heat: densidad de gatos, frecuencia de incidencias, actividad de voluntarios.
- Filtros por estado y distrito. Geolocalización automática desde móvil.

### 3. Gestión de Colonias
CRUD completo, ficha detallada con geolocalización, asociación con gatos/incidencias/CER, historial de auditoría, confirmación para acciones destructivas.

### 4. Censo Individual de Gatos
Ficha con **fotografía** (subida directa + cámara móvil), sexo, microchip, estado, historial sanitario, CER, adopciones. Certificados generables desde ficha.

### 5. Identificación Felina por IA (AI Cat ID)
- Análisis de foto con OpenAI Vision para identificar gatos por patrón de pelaje/marcas.
- Búsqueda de coincidencias en el censo registrado con scoring por similitud.
- Siempre sugiere, nunca confirma automáticamente.

### 6. Salud Animal
Vacunación, esterilización, desparasitación, microchip, cirugía, revisión. Vinculación con gato/colonia. Identificación veterinario/clínica.

### 7. Programa CER/TNR
Captura-Esterilización-Retorno. Relación animal/colonia. Indicadores por fases. Terminología adaptable por país (CER/TNR/TNVR).

### 8. Campañas de Captura
- Planificación de campañas CER/TNR con fecha inicio/fin, colonia objetivo, voluntarios y equipos asignados.
- **Timeline visual** de eventos de campaña (colocación de jaula, captura, recogida).
- Registro de eventos con marcas temporales y responsable.

### 9. Banco de Material (Trap Bank)
- Control de jaulas trampa, lectoras de microchip, transportines, tolvas.
- Sistema de préstamo con fecha límite y alertas de material no devuelto.
- **Historial de uso** por equipo con registro de acciones.

### 10. Incidencias y Quejas
Geolocalización automática, categorización, prioridad, asignación de responsable con **notificación automática**, historial de comentarios, **adjuntar fotografías**.

### 11. Inspecciones
**Plantillas configurables** de inspección (JSON schema). Formulario móvil con evaluación rápida. Resultados estructurados.

### 12. Colaboradores
Registro/aprobación, **credencial digital con QR verificable** (hash SHA-256), verificación pública vía `/api/verificar/[hash]`, gestión LOPD, notificaciones de cambio de estado.

### 13. Adopciones
Flujo completo con cambio automático de estado del gato. Consentimiento informado. Notificaciones.

### 14. Visitas a Colonias (Control de Alimentación)
Registro de cada visita con **control detallado de insumos**: cantidad de alimento (kg), tipo de pienso (seco/húmedo/mixto/especial), agua (litros), coste por reposición, necesidades especiales. Trazabilidad de horas de voluntariado.

### 15. Proveedores
Directorio de clínicas veterinarias y proveedores de servicios. Ficha con datos de contacto, especialidades, contratos vigentes. Registro de intervenciones con costes asociados.

### 16. Comunicaciones
Chat interno con carga en tiempo real. Notificaciones por canal interno + **email** + **Web Push** (VAPID). Grupos por colonia, zona y rol. Fallback a email si push no disponible.

### 17. Informes e Indicadores
- KPIs, gráficos, exportación CSV por entidad, exportación PDF, exportación completa (JSON/CSV).
- **Motor de subvenciones DGDA** con generación automática de memorias.
- **Panel de conformidad regulatoria** (Ley 7/2023, RGPD, Directiva Hábitats, Biodiversidad 2030, TFUE, One Health).
- **Panel ODS** con métricas de impacto para los Objetivos de Desarrollo Sostenible.
- **Plantillas regulatorias multi-país** (ES, PT, IT, FR) con generación automática de informes oficiales.

### 18. Portal Ciudadano (/reportar)
Portal público sin login para que vecinos reporten avistamientos de gatos abandonados o en peligro. Foto + GPS + descripción. No muestra ubicaciones de colonias (seguridad).

### 19. Panel de Superadmin
Vista global de todas las organizaciones, métricas de uso (usuarios, operaciones, colonias), gestión de la plataforma.

### 20. Configuración y Administración
- Perfil y preferencias de usuario.
- **MFA/TOTP** (2FA con Google Authenticator, Authy, etc.).
- **RBAC**: gestión de usuarios, roles personalizados, matriz de permisos (11 módulos × 10 acciones).
- **Catálogos** configurables multilingües.
- **Plantillas** de inspección, certificado, email.
- **Políticas de retención** de datos.
- **Importación CSV** / **Exportación completa**.
- Registro de auditoría.

## Internacionalización (8 idiomas)

| Código | Idioma | Estado |
|---|---|---|
| ES | Castellano | Completo (~1080 claves) |
| EU | Euskera | Completo |
| EN | English | Completo |
| CA | Català | Completo |
| GL | Galego | Completo |
| PT | Português | Completo |
| IT | Italiano | Completo |
| FR | Français | Completo |

Terminología adaptable por país: CER (España) = TNR (internacional) = TNVR (EE.UU.). Campo `terminology_profile` en organizaciones.

## Multi-Moneda

Campo `currency` en organizaciones (EUR por defecto). Formateo de importes según locale. Soporte para EUR, GBP, USD, CHF, BRL, PLN, CZK, SEK, NOK, DKK, RON, HUF.

## Plantillas Regulatorias Multi-País

| País | Tipo | Marco Legal |
|---|---|---|
| 🇪🇸 España | Memoria Anual CER | Ley 7/2023 |
| 🇪🇸 España | Informe para Pleno Municipal | Ley 7/2023 |
| 🇵🇹 Portugal | Relatório Anual ICNF | Lei 27/2016 |
| 🇮🇹 Italia | Relazione Annuale ASL | Legge 281/1991 |
| 🇫🇷 Francia | Rapport Annuel Préfecture | Code Rural |

Generación automática con datos recopilados de la BD. Accesibles desde la sección Informes > DGDA.

## PWA con Soporte Offline

- Service Worker con estrategia cache-first para assets estáticos.
- Cola de operaciones offline (IndexedDB) para visitas y avistamientos.
- Sincronización automática al recuperar conexión.
- Indicador visual de modo offline en la UI.

## Notificaciones Web Push

- Registro de suscripción push en el navegador (VAPID).
- Tabla `push_subscriptions` en BD.
- Envío de push al asignar incidencia, al capturar gato en campaña, al aprobar colaborador.
- Fallback a email si push no disponible.

## API Pública REST (v1)

- Endpoints versionados (`/api/v1/`) con autenticación por API key.
- Documentación OpenAPI auto-generada en `/api/v1/openapi`.
- Rate limiting por API key.
- Endpoints: stats, colonies (CRUD), cats (CRUD).

## Seguridad (ENS Categoría Media)

- Better Auth: bcrypt, sesiones JWT (7 días), rate limiting (10/min).
- **MFA/TOTP** con Better Auth plugin.
- **Rotación obligatoria de contraseñas** (configurable, por defecto 90 días).
- **Bloqueo progresivo por intentos fallidos** (máx. 5 intentos, 30 min bloqueo).
- **Registro de intentos de acceso** (`loginAttempts`).
- **Registro de incidentes de seguridad** (`securityIncidents`).
- **Plan de Respuesta a Incidentes** (doc: `docs/plan-incidentes-seguridad.md`).
- Contraseñas: mín. 8, máx. 128 caracteres.
- Cabeceras HTTP: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Cifrado TLS en tránsito, AES-256 en reposo (Neon).
- RBAC con principio de mínimo privilegio.
- Auditoría completa de todas las acciones.
- Validación MIME + tamaño en uploads.

## RGPD / Protección de Datos

- Datos en UE (Neon PostgreSQL, región Frankfurt).
- Sin transferencias internacionales.
- Políticas de retención configurables por entidad.
- Información de privacidad para colaboradores (firma digital).
- Derechos de acceso, rectificación, supresión, portabilidad.
- Separación de datos personales y operativos.

## Testing

| Capa | Herramienta | Cobertura |
|---|---|---|
| Unit | Vitest | Utilidades, helpers, validaciones, scoring, CSV, currency, terminology |
| Integration | Vitest + jsdom | API endpoints, form actions, páginas, auth flow, service worker |
| E2E | Playwright | Flujos críticos (login, crear colonia, crear gato, crear incidencia) |

656+ tests automatizados. Configuración en `vitest.config.ts` y `playwright.config.ts`.

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
OPENAI_API_KEY=sk-...              # Para identificación IA (opcional)
VAPID_PUBLIC_KEY=...               # Para Web Push (opcional)
VAPID_PRIVATE_KEY=...              # Para Web Push (opcional)
SMTP_HOST=smtp.example.com         # Opcional
SMTP_PORT=587                      # Opcional
SMTP_USER=user@example.com         # Opcional
SMTP_PASS=password                 # Opcional
SMTP_FROM=noreply@example.com      # Opcional
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

### Tests
```bash
npm run test           # Vitest (unit + integration)
npx playwright test    # E2E
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
| `/api/auth/[...all]` | * | Better Auth (login, register, 2FA) |
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
| `/api/search` | GET | Búsqueda global |
| `/api/cat-identify` | POST | Identificación felina por IA |
| `/api/citizen-report` | POST | Reporte ciudadano (sin auth) |
| `/api/regulatory-report` | GET | Plantillas regulatorias multi-país |
| `/api/subsidy-report` | GET | Informe de subvención DGDA |
| `/api/push-subscribe` | POST | Suscripción/desuscripción push |
| `/api/v1/stats` | GET | API pública: estadísticas |
| `/api/v1/colonies` | GET/POST | API pública: colonias |
| `/api/v1/colonies/[id]` | GET/PUT/DELETE | API pública: colonia individual |
| `/api/v1/cats` | GET/POST | API pública: gatos |
| `/api/v1/cats/[id]` | GET/PUT/DELETE | API pública: gato individual |
| `/api/v1/openapi` | GET | Documentación OpenAPI |

## Estructura del Proyecto

```
src/
├── lib/
│   ├── i18n/                  # ES, EU, EN, CA, GL, PT, IT, FR
│   ├── server/
│   │   ├── db/schema.ts       # Multi-tenant schema (30+ tablas)
│   │   ├── auth/              # Better Auth (MFA/TOTP, rate limit, password rotation)
│   │   ├── audit.ts           # Auditoría
│   │   ├── rbac.ts            # RBAC helpers
│   │   ├── notifications.ts   # Notificaciones (interno + email + push)
│   │   └── email.ts           # SMTP genérico (org-level)
│   ├── utils/
│   │   ├── currency.ts        # Multi-moneda
│   │   ├── terminology.ts     # Perfiles terminológicos por país
│   │   └── optimistic.ts      # UI optimista
│   ├── auth-client.ts
│   └── components/
├── routes/
│   ├── (auth)/                # Login, registro, recuperación
│   ├── (app)/                 # Módulos protegidos
│   │   ├── dashboard/         # KPIs + ODS panel
│   │   ├── mapa/              # Leaflet + Leaflet Draw + Heatmaps
│   │   ├── colonias/          # Lista + [id]
│   │   ├── gatos/             # Lista + [id] + identificar IA
│   │   ├── salud/
│   │   ├── cer/
│   │   ├── campanas/          # Campañas de captura + timeline
│   │   ├── material/          # Banco de jaulas/material + historial
│   │   ├── incidencias/
│   │   ├── inspecciones/
│   │   ├── colaboradores/
│   │   ├── adopciones/
│   │   ├── visitas/           # Control de alimentación e insumos
│   │   ├── proveedores/
│   │   ├── mensajes/
│   │   ├── informes/          # KPIs + Compliance + DGDA + ODS + Plantillas regulatorias
│   │   ├── configuracion/     # RBAC, MFA, catálogos, plantillas, retención
│   │   └── superadmin/        # Panel global de organizaciones
│   ├── reportar/              # Portal ciudadano (sin login)
│   └── api/
├── static/
│   ├── sw.js                  # Service Worker (cache + offline queue + push)
│   └── manifest.json          # PWA manifest
tests/
├── unit/                      # Tests unitarios
├── integration/               # Tests de integración
└── e2e/                       # Tests E2E (Playwright)
docs/
├── plan-incidentes-seguridad.md
├── modelo-seguridad.md
├── proteccion-datos.md
├── plan-copias-seguridad.md
├── estrategia-pruebas.md
├── plan-reversibilidad.md
└── plan-migracion.md
```

## Decisiones Técnicas

| Decisión | Resolución |
|---|---|
| Cartografía | OpenStreetMap (libre, sin coste) |
| Heatmaps | Leaflet.heat (densidad, incidencias, voluntarios) |
| WCAG | 2.1 AA |
| ENS | Categoría Media (MFA, rotación, incidentes) |
| Credencial digital | Hash SHA-256 + QR verificable públicamente |
| Notificaciones | Interno + email SMTP + Web Push (VAPID) |
| Offline | Service Worker + IndexedDB queue |
| IA identificación | OpenAI Vision (sugiere, nunca confirma) |
| Multi-moneda | EUR por defecto, 12 divisas soportadas |
| Terminología | Perfiles por país (CER/TNR/TNVR) |
| Plantillas regulatorias | ES (Ley 7/2023), PT (Lei 27/2016), IT (Legge 281/1991), FR (Code Rural) |

## Elementos que Requieren Proveedor Externo

| Elemento | Nota |
|---|---|
| Firma electrónica cualificada | Requiere proveedor certificado (ej: Viafirma, Docusign) |
| SMS | Requiere proveedor (ej: Twilio) |
| Hosting producción | Recomendado: Vercel/Railway/Fly.io (UE) |
| Certificado HTTPS | Gestionado por hosting (Let's Encrypt) |
| Auditoría externa ENS | Requiere empresa auditora certificada |
| Stripe | Para suscripciones SaaS self-service (preparado, no integrado) |
