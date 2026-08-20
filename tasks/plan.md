# Gatopolis — Plan de Desarrollo

## Spec-Driven Development Workflow

Cada nueva feature sigue el ciclo:

```
SPECIFY → PLAN → TASKS → IMPLEMENT
```

## Testing Strategy

- **Framework:** Vitest
- **Tests:** `tests/unit/` y `tests/integration/`
- **Ejecución:** `npm test` (run), `npm run test:watch` (watch), `npm run test:coverage` (coverage)
- **Seams de test:** Utilidades puras (`src/lib/utils/`), funciones i18n, lógica de negocio server-side
- **TDD obligatorio** para toda nueva feature o bug fix

## Convenciones

### Estructura de archivos
```
src/
├── lib/
│   ├── components/     → Componentes Svelte reutilizables
│   ├── i18n/           → Traducciones (es, eu, ca, en, pt, it, fr, gl)
│   ├── server/         → Lógica backend (db, auth, api-auth, push-notify)
│   ├── utils/          → Utilidades puras (currency, terminology)
│   └── stores/         → Svelte stores globales
├── routes/
│   ├── (app)/          → Rutas autenticadas
│   ├── api/            → API endpoints
│   └── reportar/       → Portal ciudadano público
tests/
├── unit/               → Tests unitarios (utilidades, i18n, lógica pura)
├── integration/        → Tests de integración (API, flujos)
└── setup.ts            → Setup global de tests
tasks/
├── plan.md             → Este archivo
└── todo.md             → Lista de tareas pendientes
```

### Code Style
- TypeScript strict mode
- Svelte 5 con runes ($state, $derived, $effect)
- Tailwind CSS 4 para estilos
- Drizzle ORM para base de datos
- Better Auth para autenticación

### Boundaries
- **Always:** Run tests antes de commit, validar inputs, usar i18n keys
- **Ask first:** Cambios de schema, nuevas dependencias, cambios en auth
- **Never:** Commitear secretos, editar node_modules, eliminar tests sin aprobación
