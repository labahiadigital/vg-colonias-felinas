import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, collaborators, healthRecords, incidents } from '$lib/server/db/schema.js';
import { audit } from '$lib/server/audit.js';
import { verifyOrgOwnership } from '$lib/server/tenant.js';
import { requireApiContext, getFormFile, getFormField } from '$lib/server/action-helpers.js';
import { parseCsv } from '$lib/server/csv.js';
import { ENTITY_MAPPERS, SUPPORTED_ENTITIES } from '$lib/server/import-mapping.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

type FkField = { field: string; table: typeof cats | typeof colonies };

const TABLE_FOR_ENTITY: Record<string, typeof colonies | typeof cats | typeof collaborators | typeof healthRecords | typeof incidents> = {
	colonies: colonies,
	cats: cats,
	collaborators: collaborators,
	health: healthRecords,
	incidents: incidents
};

const FK_FIELDS: Record<string, FkField[]> = {
	health: [{ field: 'catId', table: cats }],
	incidents: [{ field: 'colonyId', table: colonies }]
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const ctx = requireApiContext(locals, request);

	const blocked = rateLimitGuard('import', ctx.userId, request);
	if (blocked) return blocked;

	const formData = await request.formData();
	const file = getFormFile(formData, 'file');
	const entity = getFormField(formData, 'entity');

	if (!file || !entity) {
		return json({ error: 'Se requiere archivo y tipo de entidad' }, { status: 400 });
	}

	const mapper = ENTITY_MAPPERS[entity];
	const table = TABLE_FOR_ENTITY[entity];
	if (!mapper || !table) {
		return json({ error: `Entidad no soportada: ${entity}. Disponibles: ${SUPPORTED_ENTITIES.join(', ')}` }, { status: 400 });
	}
	const fkFields = FK_FIELDS[entity];

	const text = await file.text();
	const rows = parseCsv(text);
	if (rows.length === 0) {
		return json({ error: 'Archivo vacío o formato no válido' }, { status: 400 });
	}

	const errors: string[] = [];
	const validRows: Record<string, unknown>[] = [];

	const verifiedFkCache = new Map<string, boolean>();

	for (let i = 0; i < rows.length; i++) {
		try {
			const row = rows[i];
			if (!row) continue;
			const mapped = mapper.mapRow(row);
			if (ctx.organizationId) {
				mapped.organizationId = ctx.organizationId;
			}

			if (fkFields) {
				let fkValid = true;
				for (const fk of fkFields) {
					const rawFk = mapped[fk.field];
					const fkValue = typeof rawFk === 'string' ? rawFk : null;
					if (!fkValue) continue;
					const cacheKey = `${fk.field}:${fkValue}`;
					let ok = verifiedFkCache.get(cacheKey);
					if (ok === undefined) {
						ok = await verifyOrgOwnership(fk.table as Parameters<typeof verifyOrgOwnership>[0], fkValue, ctx.organizationId);
						verifiedFkCache.set(cacheKey, ok);
					}
					if (!ok) {
						errors.push(`Fila ${i + 2}: ${fk.field} "${fkValue}" no pertenece a la organización`);
						fkValid = false;
						break;
					}
				}
				if (!fkValid) continue;
			}

			validRows.push(mapped);
		} catch (err) {
			errors.push(`Fila ${i + 2}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
		}
	}

	let imported = 0;
	if (validRows.length > 0) {
		const BATCH_SIZE = 100;
		for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
			const batch = validRows.slice(i, i + BATCH_SIZE);
			try {
				await db.transaction(async (tx) => {
					await tx.insert(table).values(batch);
				});
				imported += batch.length;
			} catch {
				for (const row of batch) {
					try {
						await db.insert(table).values(row);
						imported++;
					} catch (rowErr) {
						errors.push(`Fila: ${rowErr instanceof Error ? rowErr.message : 'Error desconocido'}`);
					}
				}
			}
		}
	}

	await audit(ctx, 'system', entity, 'import', {
		entity, totalRows: rows.length, imported, errors: errors.length
	});

	return json({
		success: true,
		totalRows: rows.length,
		imported,
		errors: errors.slice(0, 20)
	});
};
