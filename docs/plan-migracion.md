# Plan de Migración de Datos

**Expediente:** 2026/CO_ASUM/0013
**Versión:** 1.0
**Estado:** Borrador técnico

## 1. Objetivo

Migrar los datos del sistema actual de gestión de colonias felinas al nuevo sistema, garantizando la integridad del histórico y la continuidad operativa.

## 2. Inventario de Fuentes

| Fuente | Formato esperado | Estado |
|--------|-----------------|--------|
| Base de datos actual | [PENDIENTE DE CONFIRMAR] | Por identificar |
| Hojas de cálculo | Excel/CSV | Por inventariar |
| Fotografías y documentos | Archivos en carpeta/servidor | Por inventariar |
| Datos cartográficos | [PENDIENTE DE CONFIRMAR] | Por identificar |

## 3. Entidades a Migrar

| Entidad | Prioridad | Volumen estimado |
|---------|-----------|-----------------|
| Colonias | Alta | [PENDIENTE DE CONFIRMAR] |
| Gatos (censo) | Alta | [PENDIENTE DE CONFIRMAR] |
| Registros sanitarios | Alta | [PENDIENTE DE CONFIRMAR] |
| Acciones CER | Alta | [PENDIENTE DE CONFIRMAR] |
| Incidencias | Media | [PENDIENTE DE CONFIRMAR] |
| Colaboradores | Media | [PENDIENTE DE CONFIRMAR] |
| Inspecciones | Media | [PENDIENTE DE CONFIRMAR] |
| Fotografías | Media | [PENDIENTE DE CONFIRMAR] |
| Documentos adjuntos | Media | [PENDIENTE DE CONFIRMAR] |

## 4. Fases de Migración

### Fase 1: Análisis y Perfilado
- Obtener acceso a los datos fuente.
- Inventariar tablas, campos y volúmenes.
- Detectar datos incompletos, duplicados o inconsistentes.
- Documentar la calidad de los datos.

### Fase 2: Mapeo de Campos
- Crear correspondencia entre campos origen y campos destino.
- Identificar transformaciones necesarias (formatos de fecha, codificaciones, etc.).
- Definir reglas de normalización para catálogos.

### Fase 3: Limpieza y Normalización
- Eliminar registros duplicados.
- Corregir datos erróneos o incompletos cuando sea posible.
- Normalizar nombres, estados y categorías según los catálogos del nuevo sistema.

### Fase 4: Migración de Prueba
- Ejecutar la migración en un entorno de pruebas.
- Validar la integridad referencial.
- Verificar que todos los registros se han migrado.
- Comprobar relaciones entre entidades.

### Fase 5: Conciliación de Resultados
- Comparar conteos: registros origen vs. registros migrados.
- Verificar muestreo aleatorio de registros.
- Documentar discrepancias y resolverlas.

### Fase 6: Migración Definitiva
- Ejecutar la migración sobre la base de datos de producción.
- Verificar integridad.
- Migrar fotografías y documentos adjuntos.

### Fase 7: Validación Post-Migración
- Verificación completa por el equipo técnico municipal.
- Comprobación funcional de las fichas migradas.
- Acta de aceptación.

## 5. Plan de Reversión

En caso de fallo durante la migración:
1. Restaurar la base de datos desde la copia de seguridad previa.
2. Los datos del sistema anterior se mantendrán accesibles como referencia.
3. Documentar la causa del fallo y aplicar correcciones.

## 6. Scripts de Migración

La migración se realizará mediante scripts TypeScript que:
- Leen datos del formato origen (CSV/Excel/API).
- Transforman y validan contra el esquema Drizzle.
- Insertan en la base de datos PostgreSQL.
- Generan un log de migración con estadísticas.

Ubicación: `scripts/migration/`

## 7. Criterios de Aceptación

- [ ] 100% de registros migrados sin pérdida.
- [ ] Relaciones entre entidades correctas.
- [ ] Fotografías y documentos accesibles.
- [ ] Datos geográficos posicionados correctamente.
- [ ] Historial de actuaciones preservado.
- [ ] Acta de aceptación firmada por responsable municipal.
