# Estrategia de Pruebas

**Expediente:** 2026/CO_ASUM/0013
**Versión:** 1.0

## 1. Tipos de Pruebas

### 1.1 Pruebas Unitarias
- Funciones de validación (Zod schemas).
- Helpers de RBAC (`hasPermission`, `getUserRole`).
- Utilidades de auditoría.
- Sistema de internacionalización.
- Funciones de generación de certificados.

### 1.2 Pruebas de Integración
- Endpoints API (auth, upload, export, seed).
- Flujos CRUD completos por módulo.
- Notificaciones automáticas al cambiar estados.

### 1.3 Pruebas de API
- Autenticación y sesiones.
- Permisos por rol.
- Validación de entradas.
- Respuestas de error.

### 1.4 Pruebas End-to-End
- Flujo completo de login → dashboard → módulos.
- Creación de colonia con gatos y acciones CER.
- Ciclo de vida de incidencia (crear → asignar → resolver → cerrar).
- Flujo de adopción completo.
- Chat y notificaciones.

### 1.5 Pruebas de Permisos
- Verificar acceso por cada rol a cada módulo.
- Verificar restricción de datos personales.
- Verificar restricción de datos sanitarios.
- Verificar acciones administrativas solo para admin.

### 1.6 Pruebas de Seguridad
- Inyección SQL (validación Drizzle ORM).
- XSS (sanitización de entradas).
- CSRF (tokens SvelteKit).
- Cabeceras de seguridad.
- Rate limiting.
- Sesiones seguras.

### 1.7 Pruebas de Accesibilidad
- Navegación por teclado.
- Lectores de pantalla.
- Contraste WCAG 2.1 AA.
- Focus visible.
- Alternativas textuales.

### 1.8 Pruebas Responsive
- Desktop (1920×1080, 1366×768).
- Tablet (768×1024, 1024×768).
- Móvil (375×667, 414×896).

### 1.9 Pruebas de Internacionalización
- Cambio ES ↔ EU.
- Claves faltantes.
- Catálogos bilingües.
- Formato de fechas y números.

### 1.10 Pruebas de Exportación
- CSV: encoding UTF-8, separadores, caracteres especiales.
- PDF: generación, contenido, formato.
- Certificados: datos correctos, numeración.

### 1.11 Pruebas Cartográficas
- Carga de mapa y capas.
- Geolocalización del dispositivo.
- Creación de polígonos.
- Navegación desde mapa a fichas.
- Filtros por distrito y estado.

### 1.12 Pruebas de Migración
- Integridad de datos migrados.
- Relaciones entre entidades.
- Fotografías y adjuntos.

### 1.13 Pruebas de Copias y Restauración
- Backup automático diario (Neon).
- Restauración desde backup.
- Verificación de integridad post-restauración.

## 2. Criterios de Aceptación (Given/When/Then)

### RF-COL-001: Crear colonia
```
Given un usuario autenticado con permiso 'colonies.create'
When completa el formulario de nueva colonia con nombre y ubicación
Then la colonia se crea con ID único y aparece en el listado y en el mapa
```

### RF-COL-002: Editar colonia
```
Given un usuario autenticado con permiso 'colonies.edit'
When modifica los datos de una colonia existente
Then los cambios se guardan y se registra en auditoría
```

### RF-COL-003: Eliminar colonia
```
Given un usuario autenticado con permiso 'colonies.admin'
When solicita eliminar una colonia
Then se muestra diálogo de confirmación
And al confirmar, la colonia se elimina con registro de auditoría
```

### RF-GAT-001: Ficha individual de gato
```
Given un usuario autenticado
When accede a la ficha de un gato
Then ve nombre, colonia, sexo, microchip, estado, foto, historial sanitario, CER y adopciones
```

### RF-GAT-002: Subir foto de gato
```
Given un usuario creando/editando un gato
When selecciona una imagen desde el dispositivo
Then la imagen se sube al servidor y se asocia al registro
```

### RF-CER-001: Registrar actuación CER
```
Given un usuario con permiso 'cer.create'
When registra una actuación de captura-esterilización-retorno
Then se relaciona con el animal y la colonia, y aparece en indicadores
```

### RF-INC-001: Crear incidencia geolocalizada
```
Given un usuario en dispositivo móvil
When crea una incidencia y pulsa 'Obtener ubicación'
Then se capturan las coordenadas GPS automáticamente sin entrada manual
```

### RF-INC-002: Asignar responsable a incidencia
```
Given un usuario con permiso 'incidents.edit'
When asigna un responsable a una incidencia
Then el responsable recibe una notificación interna
```

### RF-INS-001: Realizar inspección desde móvil
```
Given un inspector en campo con dispositivo móvil
When completa el formulario de evaluación rápida
Then los resultados se guardan como JSON estructurado con registro de auditoría
```

### RF-COLAB-001: Aprobar colaborador
```
Given un usuario con permiso de validación
When aprueba un colaborador pendiente
Then el colaborador pasa a estado 'activo' con fecha de vigencia y recibe notificación
```

### RF-COLAB-002: Credencial digital
```
Given un colaborador activo
When accede a su ficha
Then puede ver y descargar su credencial digital con QR
```

### RF-ADOPT-001: Completar adopción
```
Given una adopción aprobada
When se marca como completada
Then el gato cambia a estado 'adoptado' y se genera notificación
```

### RF-COM-001: Chat interno
```
Given un usuario autenticado
When envía un mensaje en una conversación
Then el mensaje aparece inmediatamente en el chat
```

### RF-INF-001: Exportar datos
```
Given un usuario con permiso 'export'
When solicita exportación CSV de colonias
Then se genera un archivo CSV con todos los campos, codificado en UTF-8
```

### RF-INF-002: Certificado oficial
```
Given un usuario con permiso de salud
When genera un certificado sanitario de un gato
Then se genera un documento HTML imprimible con datos completos y número de certificado
```

### RNF-SEG-001: Cabeceras de seguridad
```
Given cualquier petición HTTP
When se procesa la respuesta
Then incluye X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
```

### RNF-I18N-001: Cambio de idioma
```
Given un usuario visualizando la aplicación en castellano
When cambia a euskera desde el selector
Then toda la interfaz se actualiza al nuevo idioma
```

### RNF-RGPD-001: Registro de auditoría
```
Given cualquier acción de creación, modificación o eliminación
When se ejecuta
Then se registra en audit_logs con usuario, entidad, acción y timestamp
```

## 3. Herramientas Recomendadas

| Tipo | Herramienta |
|------|------------|
| Unitarias | Vitest |
| E2E | Playwright |
| Accesibilidad | axe-core, Lighthouse |
| Seguridad | OWASP ZAP |
| Responsive | Playwright viewports |
| Rendimiento | Lighthouse |

## 4. Definición de Ready

Un requisito está Ready cuando:
- [ ] Tiene criterios de aceptación definidos.
- [ ] Tiene identificador único (RF-XXX-NNN / RNF-XXX-NNN).
- [ ] Las dependencias están identificadas.
- [ ] Los datos de prueba están disponibles.
- [ ] El diseño UI está definido o aprobado.

## 5. Definición de Done

Un requisito está Done cuando:
- [ ] El código cumple los criterios de aceptación.
- [ ] Pasa las pruebas unitarias y de integración.
- [ ] Funciona en castellano y euskera.
- [ ] Es responsive (desktop, tablet, móvil).
- [ ] Tiene registro de auditoría.
- [ ] Respeta los permisos RBAC.
- [ ] No introduce regresiones.
- [ ] Está documentado en el README.
