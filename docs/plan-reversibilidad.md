# Plan de Reversibilidad y Fin del Servicio

**Expediente:** 2026/CO_ASUM/0013
**Versión:** 1.0
**Estado:** Borrador técnico

## 1. Objetivo

Garantizar que, al finalizar el contrato, el Ayuntamiento de Vitoria-Gasteiz reciba todos los datos almacenados en formatos abiertos e interoperables, con documentación completa para su reutilización.

## 2. Inventario de Datos a Exportar

| Categoría | Contenido | Formato propuesto |
|-----------|-----------|-------------------|
| Base de datos completa | Todas las tablas con relaciones | PostgreSQL dump + CSV |
| Colonias | Fichas, estados, geolocalización | CSV + GeoJSON |
| Gatos | Censo individual completo | CSV |
| Registros sanitarios | Historial por animal | CSV |
| Acciones CER | Captura, esterilización, retorno | CSV |
| Incidencias | Registros con historial | CSV |
| Inspecciones | Formularios y resultados | CSV + JSON |
| Colaboradores | Datos y estados | CSV |
| Adopciones | Trazabilidad completa | CSV |
| Fotografías | Archivos originales | ZIP (JPEG/PNG) |
| Documentos | PDFs, certificados | ZIP |
| Catálogos | Configuraciones del sistema | CSV |
| Registros de auditoría | Historial de acciones | CSV |
| Usuarios y permisos | Roles, permisos (sin contraseñas) | CSV |
| Conversaciones y mensajes | Historial de comunicaciones | CSV |
| Notificaciones | Historial | CSV |

## 3. Proceso de Exportación

### Paso 1: Notificación
- El Ayuntamiento notifica la finalización del servicio con [PENDIENTE DE CONFIRMAR] días de antelación.

### Paso 2: Generación de Exportación
- Ejecución del script de exportación completa.
- Generación de CSVs para cada tabla con cabeceras descriptivas.
- Exportación de GeoJSON para datos geográficos.
- Copia de todos los archivos adjuntos (fotos, documentos).

### Paso 3: Diccionario de Datos
- Documento que describe cada tabla, campo, tipo de dato y relaciones.
- Incluye los catálogos de valores permitidos.
- Incluye el esquema de base de datos en formato SQL.

### Paso 4: Verificación de Integridad
- Conteo de registros por tabla.
- Verificación de hashes de archivos.
- Comprobación de relaciones.
- Muestreo aleatorio.

### Paso 5: Entrega Segura
- Entrega cifrada en medio acordado.
- Verificación de recepción por el Ayuntamiento.
- Acta de entrega firmada.

### Paso 6: Supresión
- Eliminación de todos los datos de los servidores del proveedor.
- Eliminación de copias de seguridad tras el periodo de retención.
- Certificado de destrucción.

## 4. Endpoint de Exportación

El sistema incluye un endpoint de exportación masiva:

```
GET /api/export-excel?type=<entidad>
```

Entidades: `colonies`, `cats`, `incidents`, `cer`, `health`, `collaborators`

Para exportación completa (requiere rol admin):
```
GET /api/export-full (a implementar para producción)
```

## 5. Formato de Entrega

- **Formato principal:** CSV con codificación UTF-8 y separador punto y coma.
- **Geográficos:** GeoJSON (RFC 7946).
- **Archivos:** ZIP con estructura de directorios que refleja la organización del sistema.
- **Esquema:** SQL (PostgreSQL) y diagrama ER.
- **Diccionario:** Documento PDF/HTML.

[PENDIENTE DE CONFIRMAR: Formato definitivo acordado con el Ayuntamiento]

## 6. Metadatos Incluidos

Cada exportación incluirá:
- Fecha y hora de generación.
- Versión del sistema.
- Conteo de registros por tabla.
- Hash SHA-256 de cada archivo.
- Manifiesto de contenido.

## 7. Criterios de Aceptación

- [ ] Todos los datos exportados sin pérdida.
- [ ] Archivos adjuntos completos y accesibles.
- [ ] Diccionario de datos comprensible.
- [ ] Relaciones entre registros documentadas.
- [ ] Formatos abiertos e interoperables.
- [ ] Verificación de integridad superada.
- [ ] Acta de entrega firmada.
- [ ] Confirmación de supresión de datos del proveedor.
