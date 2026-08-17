# Gestión de Colonias Felinas Urbanas - Vitoria-Gasteiz

Aplicación web responsive para la gestión integral de colonias felinas urbanas del Ayuntamiento de Vitoria-Gasteiz.

**Expediente:** 2026/CO_ASUM/0013

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | SvelteKit 5 + TypeScript |
| CSS | Tailwind CSS 4 |
| Base de datos | PostgreSQL (Neon, UE) |
| ORM | Drizzle ORM |
| Autenticación | Better Auth |
| Mapas | Leaflet + OpenStreetMap |
| Idiomas | ES (Castellano) + EU (Euskera) |
| Validación | Zod |

## Módulos Funcionales

### 1. Dashboard
Panel principal con KPIs en tiempo real, actividad reciente, y accesos rápidos a todos los módulos.

### 2. Cartografía y Geolocalización
- Mapa interactivo con capas editables: colonias, puntos de alimentación, incidencias, zonas críticas, zonas sensibles, zonas de campeo.
- Activar/desactivar capas individualmente.
- Filtros por estado y distrito.
- Geolocalización automática desde dispositivo móvil.
- Navegación desde el mapa a fichas de cada elemento.

### 3. Gestión de Colonias
- CRUD completo con identificador único.
- Ficha detallada con geolocalización, estado, clasificación, zonas de campeo.
- Asociación con gatos, puntos de alimentación, incidencias y acciones CER.
- Historial de cambios vía auditoría.
- Confirmación para acciones destructivas.

### 4. Censo Individual de Gatos
- Ficha individual con fotografía, sexo, estado, esterilización, microchip.
- Historial sanitario completo (vacunaciones, desparasitaciones, cirugías).
- Relación con colonia, adopciones y acciones CER.
- Trazabilidad cronológica.

### 5. Salud Animal
- Registros sanitarios: vacunación, esterilización, desparasitación, microchip, cirugía, revisión.
- Búsqueda y filtros por tipo de actuación.
- Vinculación con gato y colonia.
- Identificación del veterinario/clínica.

### 6. Programa CER (Captura-Esterilización-Retorno)
- Registro de actuaciones de captura, esterilización y retorno.
- Relación con animal y colonia.
- Indicadores de estado por fases.
- Tabla con historial evolutivo.

### 7. Incidencias y Quejas
- Registro geolocalizado con captura automática de coordenadas.
- Categorización, prioridad (crítica/alta/media/baja) y estado configurable.
- Asignación de responsable.
- Historial de comentarios y actuaciones.
- Filtros avanzados por estado, prioridad y categoría.
- Alertas visuales según prioridad.

### 8. Inspecciones
- Plantillas de inspección configurables.
- Formulario móvil con campos de evaluación rápida.
- Asociación con colonias.
- Registro de resultados estructurados y observaciones.

### 9. Colaboradores
- Registro, aprobación/rechazo, alta/baja.
- Credencial digital con QR.
- Exportación PDF de credencial.
- Gestión LOPD (firma de información de privacidad).
- Asociación con colonias.

### 10. Adopciones y Trazabilidad
- Flujo completo: registro → aprobación → completar.
- Datos del adoptante con restricción de acceso.
- Consentimiento informado.
- Trazabilidad del cambio de estado del animal.

### 11. Comunicaciones y Notificaciones
- Chat interno con conversaciones por participantes.
- Carga de mensajes en tiempo real.
- Notificaciones segmentadas por usuario.
- Marcar leídas individualmente o en lote.

### 12. Informes e Indicadores
- KPIs globales (colonias, gatos, esterilizaciones, incidencias).
- Gráficos de evolución.
- Exportación CSV por entidad (colonias, gatos, incidencias, CER, salud, colaboradores).
- Exportación PDF de informe general.
- Registro de auditoría exportable.

### 13. Configuración y Administración
- Perfil de usuario y preferencias.
- Gestión de usuarios con asignación de roles.
- Creación de roles personalizados.
- Matriz de permisos granulares (módulo × acción).
- Catálogos configurables bilingües.
- Registro completo de auditoría.

## RBAC - Roles y Permisos

| Rol | Descripción |
|---|---|
| `admin` | Administrador municipal - acceso total |
| `tecnico` | Personal técnico municipal |
| `veterinario` | Personal veterinario/sanitario autorizado |
| `entidad_gestora` | Entidad gestora o coordinadora |
| `colaborador` | Persona colaboradora/alimentadora autorizada |

**11 módulos × 10 acciones = 110 permisos base**, asignados por rol:
`view`, `create`, `edit`, `validate`, `close`, `export`, `admin`, `access_personal_data`, `access_health_data`, `access_geo_sensitive`.

## Accesibilidad

- Skip navigation (saltar al contenido principal).
- Focus visible en todos los controles interactivos.
- `aria-label` en navegación, botones y diálogos.
- `role` y `aria-modal` en diálogos de confirmación.
- Contraste adecuado (WCAG 2.1 AA como referencia).
- Formularios accesibles con labels asociados.

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

Copiar `.env.example` a `.env` y configurar:

```
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
BETTER_AUTH_SECRET=clave-secreta-segura-minimo-32-caracteres
BETTER_AUTH_URL=http://localhost:5173
```

### Migración de Base de Datos

```bash
npx drizzle-kit push
```

### Seed de Datos Demo

Con el servidor en marcha:

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
| `/api/auth/[...all]` | * | Better Auth endpoints |
| `/api/seed` | POST | Seed de datos demo (key=seed-2026-vg) |
| `/api/set-locale` | POST | Cambiar idioma |
| `/api/messages/[conversationId]` | GET | Mensajes de una conversación |
| `/api/export-excel` | GET | Exportación CSV (type: colonies/cats/incidents/cer/health/collaborators) |
| `/api/export-pdf` | GET | Informe general PDF/HTML |
| `/api/credencial/[id]` | GET | Credencial digital de colaborador |
| `/api/certificado/[catId]` | GET | Certificados (type: health/sterilization/cer) |
| `/api/upload` | POST | Subida de archivos (multipart/form-data) |

## Internacionalización

Dos idiomas en igualdad: Castellano (es) y Euskera (eu). Sistema de claves en `src/lib/i18n/`. Selector de idioma en cabecera. Catálogos bilingües.

## Seguridad y RGPD

- Autenticación con Better Auth (email + contraseña, UUID para IDs)
- Política de contraseñas: mínimo 8, máximo 128 caracteres
- Rate limiting: 10 intentos/minuto
- RBAC con permisos granulares por módulo y acción
- Registro de auditoría para todas las acciones relevantes
- Base de datos en UE (Neon PostgreSQL)
- Cifrado en tránsito (TLS) y en reposo (AES-256)
- Cabeceras de seguridad: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Principio de mínimo privilegio
- Separación de datos personales y operativos
- Información de privacidad para colaboradores
- Confirmación para acciones destructivas
- Validación de tipo MIME y tamaño máximo (10MB) en subida de archivos

## Catálogos Configurables

Estados, categorías y clasificaciones se gestionan desde Configuración > Catálogos:

- Estado de colonia, clasificación
- Estado de gato
- Categoría y prioridad de incidencia
- Tipo de actuación sanitaria
- Estado de adopción y colaborador

37 entradas bilingües (ES/EU) precargadas.

## Estructura del Proyecto

```
src/
├── lib/
│   ├── i18n/              # Internacionalización ES/EU
│   ├── server/
│   │   ├── db/            # Schema Drizzle + conexión Neon
│   │   ├── auth/          # Better Auth config (UUID)
│   │   ├── audit.ts       # Utilidad de auditoría
│   │   ├── rbac.ts        # Helpers RBAC
│   │   └── notifications.ts # Notificaciones automáticas
│   ├── auth-client.ts     # Better Auth client
│   └── components/
│       ├── layout/        # Sidebar, Header
│       └── ui/            # ConfirmDialog, FileUpload
├── routes/
│   ├── (auth)/            # Login, recuperar contraseña
│   ├── (app)/             # Módulos protegidos
│   │   ├── dashboard/
│   │   ├── mapa/
│   │   ├── colonias/      # Lista + [id] detalle
│   │   ├── gatos/         # Lista + [id] detalle
│   │   ├── salud/
│   │   ├── cer/
│   │   ├── incidencias/
│   │   ├── inspecciones/
│   │   ├── colaboradores/  # Lista + [id] detalle+credencial
│   │   ├── adopciones/
│   │   ├── mensajes/
│   │   ├── informes/
│   │   └── configuracion/
│   └── api/               # Endpoints REST
```

## Funcionalidades Avanzadas

### Subida de Archivos
- Componente `FileUpload` reutilizable con preview.
- Integrado en gatos, incidencias e inspecciones.
- Validación: JPEG, PNG, WebP, GIF, PDF, XLSX, DOCX. Máximo 10MB.
- Captura directa desde cámara del dispositivo (`capture="environment"`).

### Edición Cartográfica
- Leaflet Draw integrado para crear polígonos, líneas y puntos.
- Exportación a GeoJSON del dibujo creado.

### Certificados Oficiales
- Certificado Sanitario, de Esterilización y de Actuación CER.
- Generados como HTML imprimible con número de certificado y datos completos.
- Accesibles desde la ficha individual del gato.

### Notificaciones Automáticas
- Al cambiar estado de incidencia, adopción o colaborador.
- Al asignar responsable de incidencia.
- Almacenadas en BD y consultables en el módulo de Mensajes.

## Documentación Técnica

Ubicada en `docs/`:

| Documento | Contenido |
|-----------|-----------|
| `plan-migracion.md` | Fases, inventario, scripts y criterios de aceptación |
| `plan-reversibilidad.md` | Exportación, formatos, supresión y entrega |
| `estrategia-pruebas.md` | Tipos de prueba, Given/When/Then, herramientas, DoR/DoD |
| `plan-copias-seguridad.md` | Política de backup, RPO/RTO, restauración |
| `modelo-seguridad.md` | Autenticación, RBAC, cabeceras, OWASP |
| `proteccion-datos.md` | RGPD, datos tratados, derechos, conservación |

## Elementos PENDIENTE DE CONFIRMAR

Estos elementos requieren decisión municipal, validación jurídica o contractual:

### Requiere decisión municipal
- Formato y validez oficial de la credencial digital (firma electrónica)
- Plantillas oficiales de certificados e inspecciones
- Integraciones con GIS municipal existente
- Proveedor cartográfico definitivo (propuesto: OpenStreetMap)
- SLA contractual y tiempos de respuesta
- Navegadores y versiones mínimas compatibles
- Estándar WCAG contractual definitivo (propuesto: 2.1 AA)
- Canales externos de notificación (SMS, email transaccional)

### Requiere validación jurídica/contractual
- Bases jurídicas RGPD y plazos de conservación por tipo de dato
- Texto informativo de privacidad para colaboradores
- Contratos de subencargado (Neon, hosting)
- ENS y certificaciones de seguridad aplicables
- RPO, RTO y disponibilidad garantizada

### Requiere datos del sistema actual
- Datos, formato y volumen para migración
- Inventario de fuentes de datos existentes
