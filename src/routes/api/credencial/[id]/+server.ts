import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, colonies } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';
import { orgScope, loadOrgColonies } from '$lib/server/tenant.js';
import { requireApiUser } from '$lib/server/action-helpers.js';
import { escHtml, htmlDocHeaders } from '$lib/server/html.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';
import { toStringArray } from '$lib/index.js';

function generateVerificationHash(id: string, name: string): string {
	return createHash('sha256').update(`${id}:${name}:${randomBytes(8).toString('hex')}`).digest('hex').slice(0, 32);
}

export const GET: RequestHandler = async ({ params, locals, request }) => {
	requireApiUser(locals);
	const blocked = rateLimitGuard('export', locals.user?.id, request);
	if (blocked) return blocked;

	const orgId = locals.organizationId;
	const col = await db.select().from(collaborators).where(and(eq(collaborators.id, params.id), orgScope(collaborators.organizationId, orgId))).limit(1);
	if (!col[0]) throw error(404, 'Colaborador no encontrado');
	if (col[0].status !== 'active') throw error(403, 'Credencial solo disponible para colaboradores activos');

	const c = col[0];

	let hash = c.verificationHash;
	if (!hash) {
		hash = generateVerificationHash(c.id, c.name);
		await db.update(collaborators).set({ verificationHash: hash }).where(and(eq(collaborators.id, c.id), orgScope(collaborators.organizationId, orgId)));
	}

	const baseUrl = env.BETTER_AUTH_URL || 'http://localhost:5173';
	const verifyUrl = `${baseUrl}/api/verificar/${hash}`;

	const allColonies = await loadOrgColonies(orgId);
	const colonyMap = new Map(allColonies.map(co => [co.id, co.name]));
	const assignedNames = toStringArray(c.assignedColonies).map(id => colonyMap.get(id) ?? id);

	const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Credencial - ${escHtml(c.name)}</title>
<style>
@page { size: A5 portrait; margin: 1cm; }
body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #fff; }
.card { border: 3px solid #005a4d; border-radius: 16px; overflow: hidden; max-width: 380px; margin: 0 auto; }
.header { background: linear-gradient(135deg, #005a4d, #00897b); color: #fff; text-align: center; padding: 16px; }
.header h1 { font-size: 14px; margin: 0; letter-spacing: 0.5px; }
.header h2 { font-size: 11px; margin: 4px 0 0; opacity: 0.85; }
.header p { font-size: 10px; margin: 6px 0 0; opacity: 0.8; font-weight: 600; letter-spacing: 1px; }
.body { padding: 20px; text-align: center; }
.avatar { width: 80px; height: 80px; border-radius: 50%; background: #e0f2f1; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #005a4d; margin: 0 auto 12px; border: 3px solid #005a4d; }
${c.photo ? `.avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }` : ''}
.name { font-size: 18px; font-weight: bold; color: #1f2937; }
.doc-id { font-size: 11px; color: #6b7280; margin-top: 2px; }
.cred-id { font-size: 9px; color: #9ca3af; font-family: monospace; margin-top: 2px; }
.qr { margin: 16px auto; }
.qr img { border-radius: 8px; border: 1px solid #e5e7eb; }
.verify-url { font-size: 8px; color: #9ca3af; word-break: break-all; margin-top: 4px; max-width: 200px; margin-left: auto; margin-right: auto; }
.info { margin-top: 12px; font-size: 11px; color: #374151; text-align: left; padding: 0 8px; }
.info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
.info-label { font-weight: 600; color: #555; }
.info-value { color: #111; }
.status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; background: #dcfce7; color: #16a34a; }
.footer { background: #f8faf9; text-align: center; padding: 10px; font-size: 8px; color: #999; border-top: 1px solid #e5e7eb; }
.hash { font-family: monospace; font-size: 8px; color: #aaa; margin-top: 4px; }
@media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>CREDENCIAL DE PERSONA COLABORADORA</h1>
    <h2>LAGUNTZAILE PERTSONAREN EGIAZTAGIRIA</h2>
    <p>COLONIAS FELINAS URBANAS</p>
  </div>
  <div class="body">
    <div class="avatar">${c.photo ? `<img src="${c.photo}" alt="${escHtml(c.name)}">` : escHtml(c.name.charAt(0))}</div>
    <div class="name">${escHtml(c.name)}</div>
    ${c.documentId ? `<div class="doc-id">${escHtml(c.documentId)}</div>` : ''}
    <div class="cred-id">CRED-${c.id.slice(0, 8).toUpperCase()}</div>
    <div class="qr">
      <img src="${qrApiUrl}" alt="QR de verificación" width="140" height="140" />
      <div class="verify-url">Escanear para verificar autenticidad</div>
    </div>
    <div class="info">
      <div class="info-row">
        <span class="info-label">Estado</span>
        <span class="status-badge">ACTIVO/A</span>
      </div>
      <div class="info-row">
        <span class="info-label">Colonias asignadas</span>
        <span class="info-value">${escHtml(assignedNames.join(', ') || 'Sin asignar')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Válida hasta</span>
        <span class="info-value">${c.validUntil ? new Date(c.validUntil).toLocaleDateString('es-ES') : 'Sin fecha límite'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">LOPD firmada</span>
        <span class="info-value">${c.privacyNoticeSigned ? 'Sí' : 'Pendiente'}</span>
      </div>
    </div>
  </div>
  <div class="footer">
    Gatopolis &middot; Verificable en ${escHtml(verifyUrl)}
    <div class="hash">Hash: ${hash}</div>
  </div>
</div>
</body>
</html>`;

	return new Response(html, {
		headers: htmlDocHeaders(`credencial-${c.id.slice(0, 8)}.html`)
	});
};
