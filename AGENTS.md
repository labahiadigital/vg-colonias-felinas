# AGENTS.md — Gatopolis Development History

Historial completo de desarrollo, decisiones y contexto generado a lo largo de las sesiones de trabajo con agentes IA.

---

## Conversaciones del Proyecto

### 1. [Desarrollo completo de la plataforma](73a2bd0f-f1d8-4432-9b8b-80737e1bf277)
**Fecha:** 17 agosto 2026 (madrugada → tarde)
**Alcance:** Sesión fundacional — desarrollo del 0% al 100%

**Trabajo realizado:**
- Descarga y análisis de la documentación original de la licitación (Expediente 2026/CO_ASUM/0013, Ayuntamiento de Vitoria-Gasteiz)
- Creación del proyecto SvelteKit 5 + TypeScript desde cero
- Implementación completa de los 23 módulos funcionales:
  - Dashboard, Mapa GIS (Leaflet + Leaflet Draw), Colonias (CRUD + detalle), Gatos (CRUD + detalle + certificados), Salud veterinaria, Programa CER, Incidencias, Inspecciones, Colaboradores (+ credenciales QR), Adopciones, Visitas, Proveedores, Mensajes/Notificaciones, Informes, Configuración (RBAC, Catálogos, Plantillas, Email, Retención, Import/Export, Auditoría)
- Base de datos PostgreSQL (Neon UE) con Drizzle ORM — 30+ tablas con multi-tenancy
- Autenticación con Better Auth (JWT, bcrypt, rate limiting, RBAC)
- Internacionalización completa castellano + euskera
- Diseño responsive mobile-first con Tailwind CSS 4
- Seed de datos demo (5 colonias, 8 gatos, 4 colaboradores, incidencias, etc.)
- Generación de toda la documentación técnica (`docs/`)
- Evolución a arquitectura SaaS multi-tenant con onboarding
- Páginas legales (Privacidad, Términos de servicio)
- Plantillas configurables (certificados HTML, inspecciones JSON Schema, email con variables)
- Políticas de retención de datos RGPD
- Motor de importación/exportación CSV/JSON/GeoJSON/PDF
- Generación de documentación de licitación (8 PDFs):
  - Memoria Técnica (23 capturas de pantalla, ~3 MB)
  - Anexo X — Proposición Económica
  - Anexo IV — Condiciones Especiales
  - Anexo V — Grupo Empresarial
  - Anexo III — Confidencialidad Sobre 2
  - Anexo III — Confidencialidad Sobre 3
  - Anexos VII/VIII — Discapacidad e Igualdad
  - Guía de Presentación / Checklist
- Script Python `scripts/generar_documentacion_licitacion.py` para regenerar PDFs
- Prompt de contexto para marketing: `prompt-marketing-context.md`
- Push al repositorio GitHub

**Decisiones técnicas clave:**
| Decisión | Resolución |
|---|---|
| Cartografía | OpenStreetMap + Leaflet + Leaflet Draw (libre, sin coste) |
| WCAG | 2.1 nivel AA |
| Navegadores | Chrome, Firefox, Safari, Edge (últimas 2 versiones) |
| RPO/RTO | < 24h / < 4h |
| Disponibilidad | 99,5% mensual |
| Credencial digital | Hash SHA-256 + QR verificable vía endpoint público |
| Notificaciones | Interno (BD) + email SMTP configurable por organización |
| Retención datos | Configurable por entidad (defecto: 5 años operativos, 3 años colaboradores) |
| Certificados | 3 tipos PDF auto-generados (Sanitario, Esterilización, CER) |
| Multi-tenancy | Aislamiento por `organizationId` en todas las tablas |
| Hosting UE | Hetzner Cloud (Alemania) — Neon PostgreSQL (UE) |
| ENS | Categoría Básica |

**Errores resueltos:**
- `KeyError: Style 'Bullet'` en reportlab → renombrado a `BulletItem`
- Playwright screenshots guardando en Downloads → script PowerShell de copia
- Modal de changelog bloqueando login en capturas → `document.querySelector('div[role="dialog"]')?.remove()`
- `INVALID_ORIGIN` de Better Auth → añadido `trustedOrigins` con puertos 5173-5178

---

### 2. [Branding y naming](31e2d9a1-48ba-4462-aebe-cec3f6154eb1)
**Fecha:** 17 agosto 2026
**Alcance:** Identidad de marca

**Trabajo realizado:**
- Exploración del proyecto existente para entender el producto
- Generación de propuestas de naming para el SaaS
- Nombre seleccionado: **Gatopolis** — "Donde cada gato cuenta"
- Actualización del `package.json` con `name: "gatopolis"`
- Definición de la identidad verbal y posicionamiento de marca

---

### 3. [Mejora de interfaz con Impeccable](8c7c93cd-bd6d-4c2a-b658-498e4f9346e6)
**Fecha:** 17 agosto 2026
**Alcance:** UI/UX profesional de nivel premium

**Trabajo realizado:**
- Análisis completo del estado de la interfaz usando el framework Impeccable
- Definición del mundo visual: **Modern + Bold** (Linear/Vercel tier)
- Modo operativo: **Operate** (task-completion interface)
- Creación del `PRODUCT.md` con perfiles de usuario, propósito, posicionamiento y principios
- Creación del `DESIGN.md` con sistema de diseño completo:
  - Tipografía: Inter (400-800), base 14px
  - Paleta de colores: superficies, sidebar oscura, marca (teal #0f766e), semánticos
  - Espaciado y layout: border-radius xl/lg, max-w-7xl, sin sombras en cards
  - Iconos: SVG stroke-based, sin emojis
  - Componentes: cards, botones, inputs, badges de estado
  - Navegación: sidebar oscura 240px con grupos funcionales
  - Decisión light/dark: light principal (uso exterior), sidebar oscura como contraste
- Anti-patrones prohibidos (no emojis como iconos, no gradient text, no glass/blur, etc.)
- Refactorización de componentes UI siguiendo el nuevo design system

---

### 4. [Análisis competitivo](e1f7a195-fc15-48a1-8d39-3718e730b067)
**Fecha:** 17 agosto 2026
**Alcance:** Benchmark contra competidores directos

**Trabajo realizado:**
- Análisis exhaustivo de **Felia.app** (competidor directo español):
  - Funcionalidades: censo de colonias, fichas de gatos, gestión de alimentadores, mapa
  - Limitaciones identificadas: sin multi-tenancy, sin inspecciones, sin credenciales QR, sin motor de plantillas
- Análisis de **Zoo-Metrics** (competidor indirecto):
  - Enfoque más amplio (zoológicos, centros de rescate)
  - No especializado en colonias felinas urbanas
- Comparativa funcionalidad por funcionalidad con Gatopolis
- Identificación de ventajas competitivas diferenciales de Gatopolis:
  - Único con GIS + polígonos de zonas críticas
  - Único con credenciales digitales verificables (QR + SHA-256)
  - Único con plantillas de inspección configurables (JSON Schema)
  - Único con arquitectura SaaS multi-tenant real
  - Único con motor de importación/exportación completo
  - Único con auditoría completa y políticas de retención RGPD
- Implementación de funcionalidades adicionales identificadas durante el análisis:
  - Módulo de visitas con control de actividad de alimentadores
  - Horas de voluntariado y registro de actividad
  - Directorio de proveedores con registro de intervenciones y costes
  - Informes de subvenciones DGDA
  - Mejoras en el módulo de inspecciones (puntuación ponderada, aprobado/no aprobado)
  - Sistema de mensajería con grupos por colonia, zona y rol

---

## Estado Actual del Proyecto

**Fecha de última actualización:** 20 agosto 2026

### Plataforma
- **Estado:** 100% funcional y desplegada
- **Versión:** 2.0.0-saas
- **Módulos operativos:** 23
- **Tablas en BD:** 30+
- **Idiomas:** Castellano + Euskera (ampliable a catalán, gallego, inglés)
- **Roles:** 5 perfiles RBAC (110 permisos granulares)

### Licitación
- **Expediente:** 2026/CO_ASUM/0013
- **Entidad:** Ayuntamiento de Vitoria-Gasteiz (Dpto. Deporte, Salud y Cooperación)
- **Documentos generados:** 8 PDFs + DEUC XML
- **Estado:** Documentación completa, lista para firma electrónica y presentación
- **Plataforma de presentación:** Contratación de Euskadi (contratacion.euskadi.eus)

### Estructura de sobres (Plataforma de Contratación de Euskadi):
| Pestaña | Campo | Documento |
|---|---|---|
| **Capacidad y solvencia** | DEUC | `espd-response.xml` / `.pdf` |
| | Anexo V | `Anexo_V_Grupo_Empresarial...pdf` |
| | Anexo II | No aplica (licitador individual) |
| | Anexo IV | `Anexo_IV_Condiciones_Especiales...pdf` |
| | (Adicional) | `Anexos_VII_VIII_Discapacidad_Igualdad...pdf` |
| **Juicios de valor** | Memoria técnica | `Memoria_Tecnica_Sobre2...pdf` |
| | Anexo III | `Anexo_III_Confidencialidad_Sobre2...pdf` |
| **Fórmulas** | Anexo X | `Anexo_X_Proposicion_Economica...pdf` |
| | Anexo III | `Anexo_III_Confidencialidad_Sobre3...pdf` |

### Oferta económica:
| Concepto | Base licitación | Ofertado |
|---|---|---|
| Licencia (Año 1) | 3.750,00 € | 3.431,25 € |
| Soporte (Año 1) | 3.588,00 € | 3.283,02 € |
| Soporte (Año 2) | 3.588,00 € | 3.285,73 € |
| **Total base (2 años)** | **10.926,00 €** | **10.000,00 €** |
| IVA (21%) | 2.294,46 € | 2.100,00 € |
| **Total con IVA** | **13.220,46 €** | **12.100,00 €** |
| Baja | — | **8,48%** |
| Cuentas de usuario | 150 mínimo | **Ilimitadas** (10 puntos extra) |

---

## Estructura del Repositorio

```
responsive-web-app-for-vitoria-gasteiz-urban-feline-colonies-management/
├── src/
│   ├── lib/
│   │   ├── i18n/                     # Traducciones ES + EU
│   │   ├── server/
│   │   │   ├── db/schema.ts          # 30+ tablas multi-tenant
│   │   │   ├── auth/                 # Better Auth config
│   │   │   ├── audit.ts              # Log de auditoría
│   │   │   ├── rbac.ts               # RBAC helpers
│   │   │   ├── notifications.ts      # Motor de notificaciones
│   │   │   └── email.ts              # SMTP configurable
│   │   ├── auth-client.ts
│   │   └── components/
│   │       ├── layout/               # Sidebar, Header
│   │       └── ui/                   # ConfirmDialog, FileUpload
│   └── routes/
│       ├── (auth)/                   # Login, registro, legal
│       ├── (app)/                    # 15 módulos protegidos
│       └── api/                      # 12+ endpoints REST
├── docs/                             # 6 documentos técnicos
│   ├── plan-migracion.md
│   ├── plan-reversibilidad.md
│   ├── estrategia-pruebas.md
│   ├── plan-copias-seguridad.md
│   ├── modelo-seguridad.md
│   └── proteccion-datos.md
├── documentacion-licitacion/         # PDFs generados
│   ├── capturas/                     # 23 screenshots de la plataforma
│   ├── Memoria_Tecnica_Sobre2...pdf
│   ├── Anexo_X_Proposicion_Economica...pdf
│   ├── Anexo_IV_Condiciones_Especiales...pdf
│   ├── Anexo_V_Grupo_Empresarial...pdf
│   ├── Anexo_III_Confidencialidad_Sobre2...pdf
│   ├── Anexo_III_Confidencialidad_Sobre3...pdf
│   ├── Anexos_VII_VIII_Discapacidad_Igualdad...pdf
│   ├── Guia_Presentacion_Checklist.pdf
│   └── espd-response.xml/.pdf
├── scripts/
│   └── generar_documentacion_licitacion.py  # Generador PDF (reportlab)
├── documentacion-original/           # Docs de la licitación
├── AGENTS.md                         # Este archivo
├── DESIGN.md                         # Sistema de diseño Impeccable
├── PRODUCT.md                        # Definición de producto
├── README.md                         # Documentación técnica completa
├── prompt-marketing-context.md       # Contexto para plan de marketing
└── setup.md                          # Guía de configuración
```

---

## Stack Tecnológico Completo

| Componente | Tecnología | Versión |
|---|---|---|
| Frontend | SvelteKit | 5 |
| Lenguaje | TypeScript | 6 |
| CSS | Tailwind CSS | 4 |
| Base de datos | PostgreSQL (Neon) | — |
| ORM | Drizzle ORM | 0.45 |
| Autenticación | Better Auth | 1.2 |
| Cartografía | Leaflet + Leaflet Draw | 1.9 |
| Gráficos | Chart.js | 4.5 |
| Editor de texto | TipTap | 3.30 |
| Iconos | Lucide Svelte | 1.x |
| Validación | Zod | 3.24 |
| Procesamiento imágenes | Sharp | 0.35 |
| PDF generación (docs) | ReportLab (Python) | — |

---

## Credenciales de Desarrollo

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@vitoria-gasteiz.org | Admin2026! |
| Técnico | tecnico@vitoria-gasteiz.org | Tecnico2026! |
| Veterinario | vet@vitoria-gasteiz.org | Vet2026! |
| Entidad Gestora | gestor@vitoria-gasteiz.org | Gestor2026! |
| Colaborador | colaborador@vitoria-gasteiz.org | Colab2026! |

---

## Datos del Licitador

| Campo | Valor |
|---|---|
| Nombre | Antonio Jose Tortonda Borreda |
| NIF | 03150909R |
| Domicilio | C/Santa Barbara 40, Puerta 1 |
| Localidad | Aldaia (Valencia) |
| CP | 46960 |
| Teléfono | 681955195 |
| Email | tonitortonda@labahia.digital |
| Marca | La Bahia Digital |

---

## Competencia Analizada

| Competidor | URL | Tipo | Ventajas Gatopolis |
|---|---|---|---|
| Felia.app | https://www.felia.app/ | Directo (colonias felinas) | Multi-tenant, GIS con polígonos, inspecciones JSON Schema, credenciales QR, auditoría completa, RBAC granular, import/export, retención RGPD |
| Zoo-Metrics | https://zoo-metrics.com/ | Indirecto (gestión animal general) | Especialización en colonias felinas urbanas, cumplimiento Ley 7/2023, cooficialidad lingüística, programa CER integrado |

---

## Contexto Normativo

- **Ley 7/2023** de protección de los derechos y el bienestar de los animales (España)
- **Ley 6/1993** de sanidad animal del País Vasco
- **RGPD 2016/679** + **LOPDGDD 3/2018** (protección de datos)
- **Ley 9/2017** de Contratos del Sector Público (licitación)
- **WCAG 2.1 AA** (accesibilidad web)
- **ENS** Categoría Básica (Esquema Nacional de Seguridad)
