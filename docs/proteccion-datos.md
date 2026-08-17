# Modelo de Protección de Datos (RGPD)

**Expediente:** 2026/CO_ASUM/0013
**Versión:** 1.0

## 1. Principios Aplicados

| Principio | Implementación |
|-----------|---------------|
| Privacidad desde el diseño | RBAC, separación de datos, minimización |
| Privacidad por defecto | Permisos mínimos, datos ocultos por defecto |
| Minimización | Solo datos necesarios para la función |
| Limitación de finalidad | Gestión de colonias felinas exclusivamente |
| Exactitud | Validación de entradas, auditoría de cambios |
| Limitación de conservación | Configurable por entidad |
| Integridad y confidencialidad | Cifrado en tránsito, RBAC, auditoría |

## 2. Datos Personales Tratados

| Categoría | Datos | Perfiles con acceso |
|-----------|-------|-------------------|
| Usuarios del sistema | Nombre, email | admin |
| Colaboradores | Nombre, DNI/NIE, foto, dirección | admin, tecnico |
| Adoptantes | Nombre, DNI, teléfono, email, dirección | admin, tecnico (con permiso) |
| Veterinarios | Nombre, clínica | admin, tecnico, veterinario |

## 3. Control de Acceso a Datos Personales

- Permiso `access_personal_data`: requerido para ver datos de colaboradores y adoptantes.
- Permiso `access_health_data`: requerido para ver datos sanitarios detallados.
- Los colaboradores NO ven datos personales de otros colaboradores ni adoptantes.

## 4. Información de Privacidad para Colaboradores

El sistema incluye:
- Registro del consentimiento/firma de información de privacidad.
- Fecha y evidencia de la firma.
- Posibilidad de consulta y revocación.

[REQUIERE VALIDACIÓN JURÍDICA: Texto informativo definitivo de privacidad]

## 5. Derechos de los Interesados

| Derecho | Implementación |
|---------|---------------|
| Acceso | Exportación de datos del interesado |
| Rectificación | Edición de datos desde la aplicación |
| Supresión | Eliminación/anonimización de datos personales |
| Portabilidad | Exportación CSV/JSON |
| Limitación | Bloqueo de registro sin eliminación |
| Oposición | Gestión manual por el responsable |

## 6. Registro de Actividades

El registro de auditoría (`audit_logs`) documenta:
- Quién accede o modifica datos personales.
- Qué dato se modifica (sin registrar el contenido sensible en sí).
- Cuándo se realiza la operación.
- Exportaciones de datos sensibles.

## 7. Conservación de Datos

| Entidad | Periodo propuesto | Estado |
|---------|-------------------|--------|
| Datos operativos (colonias, gatos) | Duración del contrato + 2 años | [REQUIERE VALIDACIÓN JURÍDICA] |
| Datos de colaboradores | Mientras vigente + 3 años | [REQUIERE VALIDACIÓN JURÍDICA] |
| Datos de adoptantes | 5 años desde adopción | [REQUIERE VALIDACIÓN JURÍDICA] |
| Registros de auditoría | 5 años | [REQUIERE VALIDACIÓN JURÍDICA] |
| Copias de seguridad | 30 días (automático) | Implementado |

## 8. Localización de Datos

- **Servidores:** Unión Europea (Neon PostgreSQL EU).
- **Copias de seguridad:** Unión Europea.
- **Archivos adjuntos:** Servidor de la aplicación (UE).
- **Sin transferencias internacionales.**

## 9. Subencargados y Dependencias

| Servicio | Proveedor | Ubicación | Estado |
|----------|-----------|-----------|--------|
| Base de datos | Neon | UE | [REQUIERE VALIDACIÓN CONTRACTUAL] |
| Cartografía | OpenStreetMap | Global (tiles) | [REQUIERE VALIDACIÓN CONTRACTUAL] |
| Hosting aplicación | [Por determinar] | UE | [REQUIERE VALIDACIÓN CONTRACTUAL] |

## 10. Medidas Técnicas

- Cifrado en tránsito (TLS).
- Cifrado en reposo (Neon AES-256).
- Control de acceso basado en roles.
- Política de contraseñas (mín. 8 caracteres).
- Rate limiting.
- Cabeceras de seguridad.
- Validación de entradas.
- Sin datos personales en URLs ni logs técnicos.
