import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, colonies } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'No autenticado');

	const col = await db.select().from(collaborators).where(eq(collaborators.id, params.id)).limit(1);
	if (!col[0]) throw error(404, 'Colaborador no encontrado');
	if (col[0].status !== 'active') throw error(403, 'Credencial solo disponible para colaboradores activos');

	const c = col[0];
	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);
	const colonyMap = new Map(allColonies.map(co => [co.id, co.name]));
	const assignedNames = Array.isArray(c.assignedColonies)
		? (c.assignedColonies as string[]).map(id => colonyMap.get(id) ?? id)
		: [];

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Credencial - ${escapeHtml(c.name)}</title>
<style>
@page { size: A5 portrait; margin: 1cm; }
body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #fff; }
.card { border: 3px solid #1e40af; border-radius: 16px; overflow: hidden; max-width: 380px; margin: 0 auto; }
.header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; text-align: center; padding: 16px; }
.header h1 { font-size: 14px; margin: 0; }
.header h2 { font-size: 11px; margin: 4px 0 0; opacity: 0.85; }
.header p { font-size: 9px; margin: 6px 0 0; opacity: 0.7; }
.body { padding: 20px; text-align: center; }
.avatar { width: 80px; height: 80px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #1e40af; margin: 0 auto 12px; }
.name { font-size: 18px; font-weight: bold; color: #1f2937; }
.id { font-size: 10px; color: #6b7280; margin-top: 4px; font-family: monospace; }
.qr { margin: 16px auto; width: 120px; height: 120px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.qr-icon { font-size: 32px; }
.qr-text { font-size: 8px; color: #9ca3af; }
.qr-code { font-size: 7px; font-family: monospace; color: #6b7280; margin-top: 4px; }
.info { margin-top: 12px; font-size: 11px; color: #374151; }
.info p { margin: 4px 0; }
.info .label { font-weight: 600; }
.footer { background: #f9fafb; text-align: center; padding: 8px; font-size: 8px; color: #9ca3af; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>AYUNTAMIENTO DE VITORIA-GASTEIZ</h1>
    <h2>GASTEIZKO UDALA</h2>
    <p>Credencial de Persona Colaboradora Autorizada</p>
  </div>
  <div class="body">
    <div class="avatar">${escapeHtml(c.name.charAt(0))}</div>
    <div class="name">${escapeHtml(c.name)}</div>
    <div class="id">ID: ${c.id.slice(0, 8).toUpperCase()}</div>
    <div class="qr">
      <div class="qr-icon">📱</div>
      <div class="qr-text">Código QR de verificación</div>
      <div class="qr-code">${c.id.slice(0, 16)}</div>
    </div>
    <div class="info">
      <p><span class="label">Colonias:</span> ${escapeHtml(assignedNames.join(', ') || 'Sin asignar')}</p>
      <p><span class="label">Válida hasta:</span> ${c.validUntil ?? 'Sin fecha definida'}</p>
      <p><span class="label">LOPD:</span> ${c.privacyNoticeSigned ? 'Aceptada' : 'Pendiente'}</p>
    </div>
  </div>
  <div class="footer">
    Gestión de Colonias Felinas Urbanas &middot; Exp. 2026/CO_ASUM/0013 &middot; [PENDIENTE DE CONFIRMAR: formato, firma y validez de la credencial]
  </div>
</div>
</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Disposition': `attachment; filename="credencial-${c.id.slice(0, 8)}.html"`
		}
	});
};
