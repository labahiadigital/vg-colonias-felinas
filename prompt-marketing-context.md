# Contexto del producto SaaS - GATOPOLIS

Eres un experto en marketing digital y estrategia de crecimiento para productos SaaS B2G (Business-to-Government) y B2B verticales. Necesito que elabores un plan de marketing completo para mi producto. A continuacion tienes toda la informacion relevante.

---

## 1. DATOS DE LA EMPRESA

- **Nombre comercial:** La Bahia Digital
- **Titular:** Antonio Jose Tortonda Borreda (autonomo)
- **NIF:** 03150909R
- **Ubicacion:** Aldaia, Valencia, España
- **Email:** tonitortonda@labahia.digital
- **Web empresa:** labahia.digital
- **Telefono:** 681955195

---

## 2. EL PRODUCTO

- **Nombre del producto:** Gatopolis
- **Tipo:** SaaS (Software as a Service) multi-tenant
- **Sector vertical:** Gestion de colonias felinas urbanas y proteccion animal
- **Clientes objetivo:** Ayuntamientos, concejalias de salud publica, entidades gestoras de colonias felinas, asociaciones protectoras de animales
- **Ambito geografico inicial:** España (con foco en Pais Vasco, Comunidad Valenciana y expansion nacional)
- **Modelo de negocio:** Licencia SaaS anual + soporte y mantenimiento
- **Precio de referencia:** ~5.000-11.000 EUR/año (segun tamano de municipio) para 2 años de servicio
- **Primer cliente potencial:** Ayuntamiento de Vitoria-Gasteiz (licitacion publica en curso, expediente 2026/CO_ASUM/0013)
- **Estado actual:** Plataforma 100% operativa y desplegada en produccion

---

## 3. PROPUESTA DE VALOR

Gatopolis es la unica plataforma SaaS especializada en España para la gestion integral de colonias felinas urbanas conforme a la Ley 7/2023 de proteccion animal. Permite a los ayuntamientos y entidades gestoras:

- Digitalizar completamente la gestion de colonias felinas (censo, salud, CER, colaboradores)
- Cumplir automaticamente con la normativa vigente (Ley 7/2023, RGPD, normativa autonomica)
- Generar certificados oficiales automaticamente (sanitarios, esterilizacion, CER)
- Gestionar colaboradores y voluntarios con credenciales digitales verificables
- Visualizar toda la informacion sobre cartografia GIS interactiva
- Operar desde cualquier dispositivo (web responsive + PWA movil)
- Funcionar en castellano y en euskera (ampliable a otros idiomas cooficiales)

---

## 4. FUNCIONALIDADES COMPLETAS DE LA PLATAFORMA

### 4.1. Modulos principales (23 pantallas operativas)

1. **Dashboard:** Panel de control con KPIs en tiempo real (colonias activas, gatos censados, esterilizaciones, incidencias abiertas, graficos de evolucion)
2. **Mapa GIS:** Cartografia interactiva con OpenStreetMap + Leaflet + Leaflet Draw. Capas activables (colonias, puntos de alimentacion, incidencias, zonas criticas). Trazado de poligonos de zonas sensibles. Radio de campeo. Exportacion GeoJSON.
3. **Colonias:** CRUD completo de colonias con geolocalizacion, estado, distrito, gatos asociados, puntos de alimentacion, historial.
4. **Gatos:** Censo individual con ficha completa: nombre, sexo, edad, microchip, raza, color, patron, estado reproductivo, fotografias (captura directa desde camara movil), historial sanitario, documentos adjuntos.
5. **Programa CER:** Flujo completo de Captura, Esterilizacion y Retorno con trazabilidad de las tres fases, veterinario responsable y generacion automatica de certificados.
6. **Salud veterinaria:** Vacunaciones, desparasitaciones, revisiones veterinarias, intervenciones quirurgicas, con calendario de seguimiento y alertas automaticas.
7. **Incidencias:** Registro con geolocalizacion, categorizacion (sanitaria, convivencia, infraestructura, abandono), asignacion de responsable, seguimiento con historial, fotografias.
8. **Inspecciones:** Motor de inspecciones tecnicas con plantillas configurables mediante JSON Schema (el ayuntamiento define sus propios formularios sin intervencion tecnica).
9. **Colaboradores:** Registro de personas alimentadoras y voluntarias con validacion municipal previa, asignacion a colonias, control de vigencia, firma LOPD.
10. **Credenciales digitales:** Emision de credenciales verificables con codigo QR + hash SHA-256, endpoint publico de verificacion.
11. **Adopciones:** Gestion completa del proceso de adopcion: evaluacion previa, contrato, seguimiento post-adopcion, cambio automatico de estado del animal.
12. **Visitas:** Registro de visitas a colonias con control de actividad de alimentadores, estado general, gatos avistados, necesidades detectadas.
13. **Proveedores:** Directorio de clinicas veterinarias y proveedores de servicios con datos de contacto, especialidades y contratos.
14. **Mensajes/Notificaciones:** Bandeja de notificaciones internas + email transaccional SMTP configurable. Plantillas editables con variables dinamicas.
15. **Informes:** Modulo de informes con KPIs, graficos (Chart.js), exportacion PDF y CSV. Informes de subvenciones.
16. **Certificados PDF automaticos:** Tres tipos: Certificado Sanitario, Certificado de Esterilizacion, Certificado de Actuacion CER. Con numero unico, datos del animal, veterinario y espacio para firma.

### 4.2. Administracion y configuracion

17. **RBAC granular:** 5 perfiles predefinidos (Administrador, Tecnico Municipal, Veterinario, Entidad Gestora, Colaborador/a) con matriz de 110 permisos (11 modulos x 10 acciones). Totalmente configurable.
18. **Catalogos bilingues:** Configuracion de todos los desplegables y clasificaciones del sistema en castellano y euskera simultaneamente.
19. **Plantillas configurables:** Editor de plantillas de certificados (HTML), plantillas de inspeccion (JSON Schema), plantillas de email (con variables).
20. **Auditoria completa:** Log inmutable de todas las acciones (usuario, fecha, IP, tipo, entidad, valor anterior/posterior). Filtrable y exportable.
21. **Politicas de retencion de datos:** Periodos de retencion configurables por entidad con acciones automaticas (anonimizar/archivar/eliminar). Cumplimiento RGPD art. 5.1.e.
22. **Importacion/Exportacion:** Motor ETL para CSV con deteccion automatica de separadores y mapeo inteligente. Exportacion CSV, JSON, GeoJSON, PDF.
23. **Seguridad:** Politica de contraseñas configurable, rate limiting (10 intentos/min), cabeceras HTTP de seguridad, cifrado AES-256, TLS 1.3.

### 4.3. Paginas legales y onboarding

- Pagina de privacidad (RGPD/LOPDGDD)
- Terminos de servicio
- Onboarding SaaS (registro de nueva organizacion + primer administrador en 2 pasos)
- Recuperacion de contraseña

---

## 5. STACK TECNOLOGICO

| Componente | Tecnologia |
|---|---|
| Frontend | SvelteKit 5 + TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL (Neon, servidores en UE - Alemania) |
| ORM | Drizzle ORM |
| Autenticacion | Better Auth (JWT, bcrypt, rate limiting) |
| Cartografia | Leaflet + Leaflet Draw + OpenStreetMap |
| Graficos | Chart.js |
| Editor de texto | TipTap |
| Email | SMTP configurable por organizacion |
| Validacion | Zod |
| Infraestructura | Hetzner Cloud (UE) |

---

## 6. DIFERENCIADORES COMPETITIVOS

1. **Unico SaaS especializado en España** para gestion de colonias felinas conforme a la Ley 7/2023
2. **Plataforma 100% operativa**, no es un prototipo ni una maqueta
3. **Multi-tenant nativo:** cada ayuntamiento opera en su entorno aislado
4. **GIS integrado** con trazado de poligonos de zonas criticas (unico en el mercado)
5. **Certificados oficiales automaticos** (sanitario, esterilizacion, CER)
6. **Credenciales digitales verificables** con QR y hash criptografico
7. **Bilingue nativo** (castellano/euskera, ampliable)
8. **100% RGPD compliant** con servidores en la UE, cifrado, auditoria y retencion de datos
9. **Cuentas de usuario ilimitadas** sin sobrecoste
10. **Mobile-first + PWA** instalable en cualquier dispositivo
11. **Plantillas de inspeccion configurables** sin intervencion tecnica (JSON Schema)
12. **Codigo fuente propio**, sin dependencias de terceros para funcionalidades core
13. **Adaptaciones sin coste adicional** durante la vigencia del contrato

---

## 7. CONTEXTO DE MERCADO

### Marco normativo que impulsa la demanda:
- **Ley 7/2023** de proteccion de los derechos y el bienestar de los animales: obliga a todos los municipios de España a gestionar colonias felinas con metodo CER
- **Normativas autonomicas** adicionales en Pais Vasco, Cataluña, Comunidad Valenciana, etc.
- **RGPD** y **LOPDGDD**: exigen herramientas que garanticen la proteccion de datos de colaboradores y voluntarios

### Tamaño de mercado potencial:
- **8.131 municipios** en España
- Estimacion conservadora: municipios >20.000 habitantes = ~400 municipios objetivo inmediato
- Muchos gestionan colonias felinas con hojas de Excel, papel o herramientas genericas no especializadas
- La Ley 7/2023 genera una necesidad nueva y urgente de digitalizacion

### Competencia:
- **Directa especializada:** Practicamente inexistente en España para este nicho vertical
- **Indirecta:** Hojas de calculo, aplicaciones genericas de gestion animal (no especificas para colonias felinas urbanas), desarrollos a medida de consultoras locales
- **Ventaja:** Ser el primero con un SaaS especializado, operativo y conforme a la ley

### Canal de adquisicion principal:
- **Licitaciones publicas** (contratacion publica via Plataforma de Contratacion del Estado, plataformas autonomicas como Euskadi, GVA, etc.)
- **Venta directa** a concejalias de salud publica y medio ambiente
- **Asociaciones protectoras** como prescriptores

---

## 8. HITOS ACTUALES

- Plataforma completamente desarrollada y desplegada en produccion
- Primera licitacion publica presentada: Ayuntamiento de Vitoria-Gasteiz (agosto 2026)
- Documentacion tecnica completa (Memoria Tecnica de 23+ paginas con 23 capturas de pantalla)
- DEUC y toda la documentacion administrativa completada

---

## 9. OBJETIVOS DE MARKETING

1. Ganar la licitacion de Vitoria-Gasteiz como caso de exito fundacional
2. Posicionar Gatopolis como la referencia en España para gestion de colonias felinas
3. Generar leads cualificados en ayuntamientos de >20.000 habitantes
4. Crear contenido que demuestre expertise en el nicho (Ley 7/2023, metodo CER, RGPD)
5. Establecer relaciones con asociaciones protectoras como prescriptores
6. Preparar la expansion a otras comunidades autonomas con idiomas cooficiales (catalan, gallego)

---

Con toda esta informacion, elabora un plan de marketing completo y accionable para Gatopolis.
