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

1. **Dashboard** - Panel con KPIs, actividad reciente y accesos rápidos
2. **Mapa de Colonias** - Cartografía con capas (colonias, alimentación, incidencias, zonas críticas/sensibles/campeo), filtros por estado y distrito, geolocalización
3. **Gestión de Colonias** - CRUD completo, asociación con gatos, puntos de alimentación e incidencias
4. **Censo Individual de Gatos** - Ficha por animal con microchip, esterilización, historial sanitario
5. **Salud Animal** - Registros sanitarios (vacunación, esterilización, desparasitación, cirugía, microchip)
6. **Programa CER** - Captura-Esterilización-Retorno con indicadores y gráficos de evolución
7. **Incidencias y Quejas** - Registro geolocalizado, asignación de responsable, comentarios/historial, filtros avanzados
8. **Inspecciones** - Plantillas configurables, formularios, asociación con colonias
9. **Colaboradores** - Registro, aprobación, credencial digital con QR, gestión LOPD
10. **Adopciones** - Flujo completo con trazabilidad y documentación
11. **Mensajes y Comunicaciones** - Chat interno, notificaciones segmentadas
12. **Informes e Indicadores** - KPIs, gráficos, exportación CSV/PDF por módulo
13. **Configuración y Administración** - Gestión de usuarios, roles RBAC, permisos granulares, catálogos configurables, auditoría

## RBAC - Roles y Permisos

| Rol | Descripción |
|---|---|
| `admin` | Administrador municipal - acceso total |
| `tecnico` | Personal técnico municipal |
| `veterinario` | Personal veterinario/sanitario autorizado |
| `entidad_gestora` | Entidad gestora o coordinadora |
| `colaborador` | Persona colaboradora/alimentadora autorizada |

Permisos granulares por módulo: `view`, `create`, `edit`, `validate`, `close`, `export`, `admin`, `access_personal_data`, `access_health_data`, `access_geo_sensitive`.

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
| `/api/seed` | POST | Seed de datos demo |
| `/api/set-locale` | POST | Cambiar idioma |
| `/api/export-excel` | GET | Exportación CSV (type: colonies, cats, incidents, cer, health, collaborators) |
| `/api/export-pdf` | GET | Informe general PDF/HTML |
| `/api/credencial/[id]` | GET | Credencial digital de colaborador |

## Internacionalización

Dos idiomas en igualdad: Castellano (es) y Euskera (eu). Sistema de claves en `src/lib/i18n/`. Selector de idioma en cabecera.

## Seguridad y RGPD

- Autenticación con Better Auth (email + contraseña)
- RBAC con permisos granulares por módulo y acción
- Registro de auditoría para todas las acciones relevantes
- Base de datos en UE (Neon PostgreSQL)
- Cifrado en tránsito (TLS)
- Principio de mínimo privilegio
- Separación de datos personales y operativos
- Información de privacidad para colaboradores

## Catálogos Configurables

Estados, categorías y clasificaciones se gestionan desde Configuración > Catálogos:

- Estado de colonia, clasificación
- Estado de gato
- Categoría y prioridad de incidencia
- Tipo de actuación sanitaria
- Estado de adopción y colaborador

## Estructura del Proyecto

```
src/
├── lib/
│   ├── i18n/           # Internacionalización ES/EU
│   ├── server/
│   │   ├── db/         # Schema Drizzle + conexión Neon
│   │   ├── auth/       # Better Auth config
│   │   ├── audit.ts    # Utilidad de auditoría
│   │   └── rbac.ts     # Helpers RBAC
│   ├── auth-client.ts  # Better Auth client
│   └── components/     # Componentes layout
├── routes/
│   ├── (auth)/         # Login, recuperar contraseña
│   ├── (app)/          # Módulos protegidos
│   │   ├── dashboard/
│   │   ├── mapa/
│   │   ├── colonias/
│   │   ├── gatos/
│   │   ├── salud/
│   │   ├── cer/
│   │   ├── incidencias/
│   │   ├── inspecciones/
│   │   ├── colaboradores/
│   │   ├── adopciones/
│   │   ├── mensajes/
│   │   ├── informes/
│   │   └── configuracion/
│   └── api/            # Endpoints REST
```

## Elementos [PENDIENTE DE CONFIRMAR]

- Formato, firma y validez de la credencial digital
- Plantillas oficiales de certificados e inspecciones
- Integraciones GIS municipales
- Proveedor cartográfico definitivo
- Firma electrónica de documentos
- Canales externos de notificación (SMS, email transaccional)
- SLA contractual y tiempos de respuesta
- RPO, RTO y disponibilidad garantizada
- ENS, certificaciones de seguridad
- Datos y formato de migración del sistema actual
- Formato de reversibilidad y entrega de datos
