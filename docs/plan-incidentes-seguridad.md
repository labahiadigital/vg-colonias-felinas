# Plan de Respuesta a Incidentes de Seguridad

**Expediente:** 2026/CO_ASUM/0013  
**Versión:** 1.0  
**Categoría ENS:** Media  
**Fecha de aprobación:** 2026-08-20  

---

## 1. Objetivo

Establecer los procedimientos para la gestión de incidentes de seguridad de la información que afecten a la plataforma Gatopolis, cumpliendo con los requisitos del Esquema Nacional de Seguridad (ENS) categoría Media, el RGPD y la Ley 7/2023.

## 2. Alcance

Este plan aplica a todos los incidentes de seguridad que afecten a:

- La plataforma web Gatopolis y sus APIs
- La base de datos PostgreSQL (Neon)
- Los datos personales de usuarios, colaboradores y ciudadanos
- Los datos de ubicación de colonias felinas (datos geo-sensibles)
- Las infraestructuras de hosting y despliegue

## 3. Clasificación de Incidentes

### 3.1 Niveles de Severidad

| Nivel | Descripción | Ejemplo | Tiempo de Respuesta |
|-------|-------------|---------|---------------------|
| **Crítico** | Compromiso de datos personales, acceso no autorizado masivo | Brecha de datos, inyección SQL exitosa | < 1 hora |
| **Alto** | Acceso no autorizado a funcionalidades, escalada de privilegios | Bypass de autenticación, acceso admin no autorizado | < 4 horas |
| **Medio** | Intentos de acceso fallidos masivos, anomalías en logs | Fuerza bruta detectada, scraping de datos | < 24 horas |
| **Bajo** | Vulnerabilidad detectada sin explotación, error de configuración | Dependencia vulnerable, header faltante | < 72 horas |

### 3.2 Tipos de Incidentes

1. **Acceso no autorizado** — Login fraudulento, escalada de privilegios, sesiones comprometidas
2. **Fuga de datos** — Exfiltración de datos personales, exposición de ubicaciones sensibles
3. **Denegación de servicio** — Ataques DDoS, sobrecarga de recursos
4. **Malware/Inyección** — XSS, SQL Injection, CSRF explotado
5. **Ingeniería social** — Phishing dirigido a usuarios del sistema
6. **Error interno** — Configuración incorrecta, exposición accidental de datos

## 4. Equipo de Respuesta a Incidentes (CSIRT)

| Rol | Responsabilidad |
|-----|-----------------|
| **Responsable de Seguridad** | Coordinación general, comunicación con autoridades |
| **Administrador de Sistemas** | Contención técnica, análisis forense |
| **DPO (Delegado de Protección de Datos)** | Evaluación RGPD, notificación a AEPD |
| **Responsable del Servicio** | Comunicación con el Ayuntamiento y usuarios afectados |

## 5. Procedimiento de Respuesta

### Fase 1: Detección e Identificación (< 30 min)

1. **Monitorización automática:**
   - Tabla `login_attempts` — Detección de intentos fallidos masivos
   - Tabla `audit_logs` — Anomalías en patrones de uso
   - Tabla `security_incidents` — Registro centralizado
   - Rate limiting (Better Auth) — Bloqueo automático tras 5 intentos fallidos

2. **Clasificación inicial:**
   - Determinar tipo y severidad del incidente
   - Asignar responsable del CSIRT
   - Crear registro en tabla `security_incidents`

### Fase 2: Contención (< 2 horas para Crítico)

1. **Contención inmediata:**
   - Bloquear cuentas comprometidas (desactivar sesiones)
   - Bloquear IPs sospechosas en el WAF/firewall
   - Revocar tokens y API keys afectados
   - Si es necesario, activar modo mantenimiento

2. **Contención a corto plazo:**
   - Resetear contraseñas de usuarios afectados
   - Rotar secretos de autenticación (`BETTER_AUTH_SECRET`)
   - Aplicar parches de emergencia si hay vulnerabilidad conocida

### Fase 3: Erradicación (< 24 horas)

1. **Análisis de causa raíz:**
   - Revisar `audit_logs` del período afectado
   - Analizar `login_attempts` para patrones de ataque
   - Examinar logs del servidor y la base de datos
   - Identificar vectores de ataque utilizados

2. **Eliminación de la amenaza:**
   - Corregir vulnerabilidades explotadas
   - Actualizar dependencias comprometidas
   - Reforzar controles de acceso si es necesario

### Fase 4: Recuperación (< 48 horas)

1. **Restauración de servicios:**
   - Verificar integridad de la base de datos
   - Restaurar desde backup si hubo corrupción de datos
   - Reactivar servicios de forma gradual
   - Monitorización intensiva durante 72h post-incidente

2. **Verificación:**
   - Confirmar que la vulnerabilidad está corregida
   - Validar que no hay puertas traseras instaladas
   - Comprobar integridad de los datos restaurados

### Fase 5: Lecciones Aprendidas (< 7 días)

1. **Informe post-incidente:**
   - Cronología completa del incidente
   - Acciones tomadas y su efectividad
   - Datos afectados y usuarios impactados
   - Coste estimado del incidente

2. **Mejoras:**
   - Actualizar este plan si es necesario
   - Implementar controles preventivos adicionales
   - Programar formación si aplica
   - Actualizar la Declaración de Aplicabilidad ENS

## 6. Notificaciones Obligatorias

### 6.1 RGPD — Brecha de Datos Personales

| Destinatario | Plazo | Condición |
|-------------|-------|-----------|
| **AEPD** | 72 horas desde la detección | Si existe riesgo para derechos y libertades |
| **Usuarios afectados** | Sin demora indebida | Si existe riesgo alto |
| **CCN-CERT** | 24 horas (incidentes graves ENS) | Si afecta al sector público |

### 6.2 Contenido de la Notificación a AEPD

- Naturaleza de la brecha y datos afectados
- Número aproximado de usuarios afectados
- Nombre y datos de contacto del DPO
- Consecuencias probables
- Medidas adoptadas para remediar

### 6.3 Comunicación Interna

- Ayuntamiento contratante: notificación inmediata (< 4h para incidentes críticos)
- Usuarios del sistema: según protocolo establecido en contrato

## 7. Medidas Preventivas Implementadas

### 7.1 Autenticación Reforzada (ENS Media)

- **MFA/TOTP obligatorio** para roles admin y técnico
- **Contraseña mínima:** 12 caracteres
- **Rotación de contraseñas:** cada 90 días (configurable)
- **Bloqueo progresivo:** tras 5 intentos fallidos, bloqueo de 30 minutos
- **Registro de intentos:** tabla `login_attempts` con IP y User-Agent

### 7.2 Monitorización Continua

- Rate limiting: 10 peticiones/minuto por IP en endpoints de auth
- Registro de auditoría completo en `audit_logs`
- Alertas automáticas por patrones anómalos
- Revisión periódica de logs (semanal)

### 7.3 Protección de Datos Geo-Sensibles

- Ubicaciones de colonias solo accesibles con permiso `access_geo_sensitive`
- Portal ciudadano (`/reportar`) NO expone ubicaciones de colonias
- Datos de voluntarios y colaboradores protegidos por RBAC

## 8. Pruebas y Simulacros

| Actividad | Frecuencia | Responsable |
|-----------|-----------|-------------|
| Revisión del plan | Semestral | Responsable de Seguridad |
| Simulacro de brecha de datos | Anual | CSIRT completo |
| Test de penetración | Anual | Auditor externo |
| Verificación de backups | Mensual | Administrador de Sistemas |
| Revisión de accesos | Trimestral | DPO |

## 9. Registro de Incidentes

Todos los incidentes se registran en la tabla `security_incidents` con:

- Tipo y severidad
- Descripción detallada
- Usuario/IP afectado
- Estado (abierto → en investigación → resuelto → cerrado)
- Fecha de resolución y responsable
- Detalles técnicos (JSON)

## 10. Declaración de Aplicabilidad ENS — Categoría Media

### Controles implementados:

| ID ENS | Control | Estado |
|--------|---------|--------|
| op.acc.1 | Identificación | Implementado (email + contraseña) |
| op.acc.2 | Requisitos de acceso | Implementado (RBAC granular) |
| op.acc.3 | Segregación de funciones | Implementado (5 roles + permisos) |
| op.acc.4 | Proceso de gestión de derechos de acceso | Implementado (panel admin) |
| op.acc.5 | Mecanismo de autenticación | Implementado (MFA/TOTP) |
| op.acc.6 | Acceso local | N/A (aplicación web) |
| op.acc.7 | Acceso remoto | Implementado (HTTPS + MFA) |
| op.exp.1 | Inventario de activos | Implementado (schema.ts) |
| op.exp.2 | Configuración de seguridad | Implementado (headers, CSP) |
| op.exp.3 | Gestión de la configuración | Implementado (Git + CI/CD) |
| op.exp.4 | Mantenimiento | Implementado (npm audit, actualizaciones) |
| op.exp.5 | Gestión de cambios | Implementado (Git + revisión) |
| op.exp.6 | Protección frente a código dañino | Implementado (validación entradas) |
| op.exp.7 | Gestión de incidentes | Implementado (este documento) |
| op.exp.8 | Registro de la actividad | Implementado (audit_logs) |
| op.exp.9 | Registro de la gestión de incidentes | Implementado (security_incidents) |
| op.exp.10 | Protección de los registros | Implementado (acceso restringido) |
| op.exp.11 | Protección de claves criptográficas | Implementado (env vars, bcrypt) |
| mp.info.1 | Datos de carácter personal | Implementado (RGPD + LOPDGDD) |
| mp.info.2 | Calificación de la información | Implementado (niveles de acceso) |
| mp.info.3 | Cifrado | Implementado (TLS + bcrypt) |
| mp.info.4 | Firma electrónica | Pendiente (certificados digitales) |
| mp.info.5 | Limpieza de documentos | Implementado (retención de datos) |
| mp.info.6 | Copias de seguridad | Implementado (Neon + backups) |
| mp.s.1 | Protección de las comunicaciones | Implementado (TLS 1.2+) |
| mp.s.2 | Protección de servicios y aplicaciones web | Implementado (CSP, CORS, headers) |

---

*Documento elaborado conforme al Real Decreto 311/2022, de 3 de mayo, por el que se regula el Esquema Nacional de Seguridad.*
