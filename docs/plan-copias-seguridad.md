# Plan de Copias de Seguridad y Restauración

**Expediente:** 2026/CO_ASUM/0013
**Versión:** 1.0

## 1. Política de Copias

| Parámetro | Valor |
|-----------|-------|
| Frecuencia | Diaria (automática) |
| Retención mínima | 30 días |
| Tipo | Incremental + completa semanal |
| Cifrado | AES-256 en reposo |
| Ubicación | UE (misma región que producción) |

## 2. Proveedor: Neon PostgreSQL

Neon proporciona:
- **Point-in-Time Recovery (PITR):** restauración a cualquier momento dentro de la ventana de retención.
- **Backups automáticos:** sin intervención manual.
- **Branching:** creación de ramas de base de datos para pruebas sin afectar producción.
- **Ubicación UE:** datos alojados en la Unión Europea.

## 3. Datos Incluidos

- Base de datos completa (todas las tablas).
- Configuración de catálogos.
- Roles y permisos.
- Registros de auditoría.

## 4. Archivos Adjuntos

Los archivos (fotografías, documentos) almacenados en el sistema de ficheros requieren una copia adicional:
- Sincronización diaria del directorio `static/uploads/` a almacenamiento secundario.
- Verificación de integridad mediante checksums.

## 5. Procedimiento de Restauración

### Restauración de Base de Datos
1. Acceder al panel de Neon.
2. Seleccionar el punto de restauración (fecha/hora).
3. Crear branch de restauración.
4. Verificar integridad de datos.
5. Si es correcto, promover a producción.

### Restauración de Archivos
1. Recuperar del almacenamiento secundario.
2. Verificar checksums.
3. Restaurar al directorio `static/uploads/`.

## 6. Pruebas de Restauración

| Frecuencia | Prueba |
|------------|--------|
| Mensual | Restauración a branch de prueba y verificación |
| Trimestral | Restauración completa simulada |
| Anual | Simulacro completo de desastre |

## 7. Monitorización

- Alertas si el backup diario no se ejecuta.
- Verificación automática de integridad.
- Dashboard de estado de backups en panel de administración.

## 8. RPO / RTO

| Parámetro | Valor propuesto | Estado |
|-----------|----------------|--------|
| RPO (Recovery Point Objective) | < 24 horas | [PENDIENTE DE CONFIRMAR] |
| RTO (Recovery Time Objective) | < 4 horas | [PENDIENTE DE CONFIRMAR] |
| Disponibilidad | 99.5% | [PENDIENTE DE CONFIRMAR] |
