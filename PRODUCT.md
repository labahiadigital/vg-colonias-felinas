# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Gestores de colonias felinas** — tres perfiles principales que convergen en una misma herramienta:

1. **Voluntarios / cuidadores en campo:** Registran actividad, reportan incidencias y actualizan censos desde dispositivos móviles, a menudo en condiciones de exterior (sol directo, manos ocupadas, conectividad irregular).
2. **Técnicos municipales / coordinadores:** Supervisan colonias, aprueban colaboradores, generan informes y toman decisiones desde escritorio.
3. **Veterinarios:** Registran intervenciones sanitarias, campañas CER y seguimiento post-operatorio, alternando entre consulta y campo.

El contexto de uso es mixto: trabajo de campo rápido (móvil) y gestión administrativa detallada (escritorio). La app debe funcionar bien en ambos.

## Product Purpose

SaaS de gestión integral de colonias de gatos urbanos. Permite a municipios, asociaciones y grupos de voluntarios gestionar el ciclo completo: censo de colonias y gatos, programas CER (Captura-Esterilización-Retorno), salud animal, incidencias, inspecciones, adopciones, colaboradores y comunicaciones — todo con trazabilidad completa.

Se diferencia de hojas de cálculo y apps genéricas por ofrecer gestión geolocalizada con mapa, historial individualizado por gato, flujos CER integrados, sistema de roles y permisos, e informes automáticos. Es un producto SaaS multi-tenant, no una herramienta interna de un solo ayuntamiento.

## Positioning

La única plataforma SaaS diseñada específicamente para la gestión profesional de colonias felinas urbanas. Combina trabajo de campo (móvil, geolocalización, registro rápido) con gestión administrativa (informes, métricas, cumplimiento normativo) en un solo sistema colaborativo con trazabilidad completa por animal.

## Operating Context

- Voluntarios trabajan en exterior, a veces con guantes, en horarios de alimentación (amanecer/atardecer)
- Técnicos municipales necesitan visión global, filtros avanzados y exportación de datos
- Veterinarios registran intervenciones rápidas durante campañas CER masivas
- Los datos se comparten entre roles: un gato capturado por un voluntario es operado por un veterinario y supervisado por un técnico
- Workflows principales: censo → CER → seguimiento salud → posible adopción; incidencia → inspección → resolución
- Mapa como eje central de la operativa (Leaflet)

## Capabilities and Constraints

**Funcionalidades confirmadas:**
- Dashboard con KPIs, actividad reciente, cumplimiento normativo (Ley 7/2023) y resumen económico
- Mapa interactivo de colonias (Leaflet con draw)
- CRUD de colonias, gatos, salud, CER, incidencias, inspecciones, colaboradores, adopciones
- Registro de visitas/actividades con geolocalización y seguimiento de horas de voluntariado
- Gestión de proveedores (veterinarios, clínicas, servicios) con registro de intervenciones y costes
- Sistema de mensajería interna con grupos por colonia, zona, rol y avisos generales
- Inspecciones con puntuación ponderada configurable, aprobado/no aprobado y seguimiento
- Generación de informes y memorias de subvención DGDA automáticas
- Carnet digital profesional con QR real y URL de verificación pública
- Configuración y perfil de usuario
- Autenticación con roles (Better Auth)
- Internacionalización (es, eu, ca, en)

**Restricciones técnicas:**
- SvelteKit 5 con Svelte 5 (runes)
- Tailwind CSS 4 (nuevo sistema @theme)
- Neon PostgreSQL + Drizzle ORM
- Debe funcionar bien en móvil (voluntarios en campo)
- Soporte offline parcial deseable pero no implementado aún

## Brand Commitments

Sin compromisos de marca. No hay logo, paleta ni identidad visual fija. Total libertad de diseño.

## Evidence on Hand

- Wireframes HTML existentes para: login, dashboard, perfil de gato, mapa, incidencias, informes, colaboradores, detalle de colonia, configuración, recuperar contraseña
- Aplicación funcional con datos reales (rutas, layouts, componentes)
- No hay testimonios, caso de estudio ni material de marketing

## Product Principles

1. **Campo primero:** cada interacción debe poder completarse con una mano, bajo el sol, en 30 segundos o menos.
2. **Trazabilidad sin fricción:** el historial de cada animal se construye naturalmente conforme los usuarios hacen su trabajo, no como tarea extra.
3. **Colaboración transparente:** todos los roles ven la misma verdad, con el nivel de detalle apropiado para su función.
4. **Datos que informan decisiones:** métricas y visualizaciones que ayudan a priorizar recursos escasos (voluntarios, presupuesto veterinario, zonas de intervención).
5. **Respeto por el contexto:** el sistema se adapta al flujo de trabajo real, no impone procesos artificiales.

## Accessibility & Inclusion

- Contraste suficiente para uso en exterior con luz directa
- Targets táctiles generosos para uso con guantes o manos ocupadas
- Jerarquía visual clara para escaneo rápido en campo
- Soporte multiidioma (castellano, euskera)
