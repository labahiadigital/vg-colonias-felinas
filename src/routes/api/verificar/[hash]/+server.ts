import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, organizations } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const hash = params.hash;

	const [col] = await db
		.select({
			id: collaborators.id,
			name: collaborators.name,
			status: collaborators.status,
			validUntil: collaborators.validUntil,
			organizationId: collaborators.organizationId,
			verificationHash: collaborators.verificationHash
		})
		.from(collaborators)
		.where(eq(collaborators.verificationHash, hash));

	if (!col) {
		return new Response(buildHtml(false, null), {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	let orgName = '';
	if (col.organizationId) {
		const [org] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, col.organizationId));
		orgName = org?.name || '';
	}

	const isValid = col.status === 'active' && (!col.validUntil || new Date(col.validUntil) >= new Date());

	return new Response(buildHtml(isValid, { name: col.name, validUntil: col.validUntil, orgName, status: col.status }), {
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
};

function buildHtml(valid: boolean, data: { name: string; validUntil: string | null; orgName: string; status: string } | null): string {
	const color = valid ? '#16a34a' : '#dc2626';
	const icon = valid ? '✓' : '✗';
	const title = valid ? 'Credencial VÁLIDA' : 'Credencial NO VÁLIDA';

	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verificación de Credencial</title>
<style>
	body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f6;margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
	.card{background:#fff;border-radius:16px;padding:32px;max-width:400px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.1);text-align:center}
	.icon{font-size:64px;color:${color};margin-bottom:16px}
	.title{font-size:20px;font-weight:700;color:${color};margin-bottom:8px}
	.info{font-size:14px;color:#555;margin:4px 0}
	.org{font-size:12px;color:#888;margin-top:12px}
	.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${valid ? '#dcfce7' : '#fee2e2'};color:${color};margin-top:8px}
</style>
</head>
<body>
<div class="card">
	<div class="icon">${icon}</div>
	<div class="title">${title}</div>
	${data ? `
		<p class="info"><strong>${data.name}</strong></p>
		${data.validUntil ? `<p class="info">Válida hasta: ${new Date(data.validUntil).toLocaleDateString('es-ES')}</p>` : ''}
		<div class="badge">${data.status === 'active' ? 'Activo/a' : data.status === 'suspended' ? 'Suspendido/a' : data.status}</div>
		${data.orgName ? `<p class="org">${data.orgName}</p>` : ''}
	` : `<p class="info">El código de verificación no corresponde a ninguna credencial registrada.</p>`}
	<p class="org" style="margin-top:24px;font-size:11px">Gestión de Colonias Felinas</p>
</div>
</body>
</html>`;
}
