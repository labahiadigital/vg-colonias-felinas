# Spec: Gatopolis — SaaS de Gestión de Colonias Felinas

## Objective

Gatopolis es una plataforma SaaS multi-tenant para la gestión profesional de colonias felinas urbanas. Cumple con la Ley 7/2023 (España) y regulaciones equivalentes europeas (PT, IT, FR). Dirigida a ayuntamientos, asociaciones protectoras y veterinarios.

**Usuarios:**
- **Admin municipal** — Gestiona colonias, genera informes regulatorios, supervisa CER
- **Técnico de campo** — Registra visitas, gestiona incidencias, ejecuta campañas CER
- **Veterinario** — Registra intervenciones sanitarias, esterilizaciones, tratamientos
- **Colaborador/Voluntario** — Alimenta colonias, reporta incidencias
- **Ciudadano (sin login)** — Reporta avistamientos vía `/reportar`
- **Superadmin** — Gestiona todas las organizaciones de la plataforma

**Success criteria:**
- Un municipio puede registrar colonias, censar gatos, y generar memorias CER en < 5 min
- La app funciona offline y sincroniza al reconectar
- Cumple ENS Categoría Media (MFA, rotación contraseñas, plan de incidentes)
- Soporta 8 idiomas y 10 monedas
- API REST pública con autenticación por API key

## Tech Stack

- **Frontend:** SvelteKit 5, Svelte 5 (runes), Tailwind CSS 4
- **Backend:** SvelteKit server routes, Drizzle ORM
- **Database:** PostgreSQL (Neon serverless)
- **Auth:** Better Auth (email/password, MFA/TOTP)
- **Maps:** Leaflet + Leaflet Draw + leaflet.heat
- **Charts:** Chart.js
- **i18n:** Custom (8 locales: es, eu, ca, en, pt, it, fr, gl)
- **Testing:** Vitest + @testing-library/svelte
- **AI:** OpenAI Vision API (cat identification)

## Commands

```bash
# Development
Dev:        npm run dev
Build:      npm run build
Preview:    npm run preview
TypeCheck:  npm run check

# Testing
Test:       npm test
TestWatch:  npm run test:watch
Coverage:   npm run test:coverage

# Database
Generate:   npm run db:generate
Migrate:    npm run db:migrate
Push:       npm run db:push
Studio:     npm run db:studio
Seed:       npx tsx scripts/seed.ts
```

## Project Structure

```
src/
├── app.html              → HTML shell con SW registration
├── app.css               → Global styles (Tailwind)
├── hooks.server.ts       → Auth middleware, security headers
├── lib/
│   ├── auth-client.ts    → Better Auth client config
│   ├── i18n/             → 8 locale files + index.ts
│   ├── server/
│   │   ├── auth/         → Better Auth server config (MFA, rate limit)
│   │   ├── db/
│   │   │   ├── index.ts  → Neon DB connection
│   │   │   └── schema.ts → Drizzle schema (20+ tables)
│   │   ├── api-auth.ts   → API key validation for REST API
│   │   └── push-notify.ts → Web Push + email fallback
│   ├── utils/
│   │   ├── currency.ts   → Multi-currency formatting (10 currencies)
│   │   └── terminology.ts → CER/TNR/TNVR profiles per country
│   └── components/
│       ├── layout/       → Sidebar, Header
│       └── ui/           → CommandPalette, OfflineIndicator, etc
├── routes/
│   ├── (auth)/           → Login, registro (unauthenticated)
│   ├── (app)/            → All authenticated routes
│   │   ├── dashboard/    → KPI dashboard
│   │   ├── colonias/     → Colony CRUD
│   │   ├── gatos/        → Cat census + [id] detail
│   │   │   └── identificar/ → AI cat identification
│   │   ├── visitas/      → Visit logging (+ feeding control)
│   │   ├── incidencias/  → Incident management
│   │   ├── mapa/         → Interactive GIS map + heatmaps
│   │   ├── informes/     → Reports (KPI, compliance, DGDA, ODS)
│   │   ├── campanas/     → Trapping campaigns
│   │   ├── material/     → Equipment/trap bank
│   │   ├── configuracion/ → User settings (MFA, preferences)
│   │   └── superadmin/   → Platform admin panel
│   ├── api/
│   │   ├── v1/           → Public REST API (colonies, cats, stats, openapi)
│   │   ├── cat-identify/ → AI cat identification endpoint
│   │   ├── citizen-report/ → Public sighting reports
│   │   ├── regulatory-report/ → Multi-country regulatory templates
│   │   ├── subsidy-report/ → DGDA subsidy reports
│   │   ├── push-subscribe/ → Web Push subscription
│   │   └── export-pdf/   → PDF report generation
│   └── reportar/         → Public citizen portal (no auth)
tests/
├── unit/                 → Pure function tests
├── integration/          → API endpoint tests
└── setup.ts              → Test globals
tasks/
├── spec.md               → This file
├── plan.md               → Development conventions
└── todo.md               → Task tracking
static/
├── sw.js                 → Service Worker (cache + offline queue)
└── manifest.json         → PWA manifest
```

## Code Style

```typescript
// SvelteKit server route pattern
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/login');

  const data = await db
    .select()
    .from(colonies)
    .where(eq(colonies.isActive, true))
    .orderBy(desc(colonies.createdAt));

  return { locale: locals.locale, data };
};

// Svelte 5 component pattern
let { data }: { data: PageData } = $props();
let locale = $derived(data.locale);
let items = $state<Item[]>([]);
```

**Conventions:**
- TypeScript strict mode
- `$state`, `$derived`, `$effect` (Svelte 5 runes)
- Drizzle queries with `.withIndex()` over `.filter()`
- i18n keys: `module.key` format (e.g. `visits.food_qty_kg`)
- API endpoints return `json()` with proper status codes
- All public functions validate inputs

## Testing Strategy

- **Framework:** Vitest 4.x
- **Environment:** jsdom (for browser APIs)
- **Location:** `tests/unit/` and `tests/integration/`
- **Coverage target:** ≥80% on `src/lib/utils/` and `src/lib/server/`

### Seams (public interfaces to test):

| Seam | Type | Location |
|------|------|----------|
| `formatCurrency()` | Unit | `src/lib/utils/currency.ts` |
| `getCurrencySymbol()` | Unit | `src/lib/utils/currency.ts` |
| `parseCurrencyAmount()` | Unit | `src/lib/utils/currency.ts` |
| `getLocaleForCountry()` | Unit | `src/lib/utils/currency.ts` |
| `getTerminology()` | Unit | `src/lib/utils/terminology.ts` |
| `getProfileForCountry()` | Unit | `src/lib/utils/terminology.ts` |
| `term()` | Unit | `src/lib/utils/terminology.ts` |
| `t()` | Unit | `src/lib/i18n/index.ts` |
| `getLocale()` | Unit | `src/lib/i18n/index.ts` |
| `generateApiKey()` | Unit | `src/lib/server/api-auth.ts` |
| `validateApiKey()` | Integration | `src/lib/server/api-auth.ts` |
| `GET /api/v1/colonies` | Integration | API endpoint |
| `GET /api/v1/cats` | Integration | API endpoint |
| `GET /api/v1/stats` | Integration | API endpoint |
| `POST /api/citizen-report` | Integration | API endpoint |
| `POST /api/cat-identify` | Integration | API endpoint |
| `GET /api/regulatory-report` | Integration | API endpoint |
| `POST /api/push-subscribe` | Integration | API endpoint |

### TDD Rules:
1. Write failing test first (RED)
2. Write minimal code to pass (GREEN)
3. Refactor (keep green)
4. Never skip watching the test fail
5. Mocks only when unavoidable (DB, external APIs)

## Boundaries

### Always:
- Run `npm test` before marking any feature complete
- Validate all user inputs server-side
- Use i18n keys for all user-facing text
- Add arg validators on all public Convex functions (if applicable)
- Keep TypeScript strict mode on

### Ask first:
- Schema changes (new tables, column modifications)
- Adding npm dependencies
- Changing auth configuration
- Modifying security headers

### Never:
- Commit `.env` or secrets
- Use `any` type (use `unknown` if needed)
- Skip auth checks on protected routes
- Use `Date.now()` in Svelte queries (pass as arg)
- Delete failing tests without approval

## Success Criteria

- [ ] All 43+ unit tests pass (`npm test`)
- [ ] App starts in dev mode (`npm run dev`)
- [ ] User can login with seed credentials
- [ ] Dashboard shows KPI data
- [ ] Map shows colonies with heatmaps
- [ ] Citizen portal (`/reportar`) works without login
- [ ] Cat identification (`/gatos/identificar`) accepts photo uploads
- [ ] Reports generate HTML with real data
- [ ] Offline indicator works when disconnecting
- [ ] API v1 endpoints respond with proper JSON
- [ ] 8 languages selectable in settings

## Open Questions

None — spec is current as of August 2026.
