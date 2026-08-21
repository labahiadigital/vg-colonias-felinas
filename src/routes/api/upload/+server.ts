import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireApiUser, getFormFile, getFormField } from '$lib/server/action-helpers.js';
import { db } from '$lib/server/db/index.js';
import { documents } from '$lib/server/db/schema.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

const UPLOAD_DIR = 'static/uploads';
const ALLOWED_TYPES: Record<string, string[]> = {
	'image/jpeg': ['jpg', 'jpeg'],
	'image/png': ['png'],
	'image/webp': ['webp'],
	'image/gif': ['gif'],
	'application/pdf': ['pdf'],
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
};
const MAX_SIZE = 10 * 1024 * 1024;
const SAFE_DIRNAME = /^[a-z0-9_-]+$/i;

function mimeToExt(mime: string): string | null {
	const exts = ALLOWED_TYPES[mime];
	return exts?.[0] ?? null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	requireApiUser(locals);

	const blocked = rateLimitGuard('upload', locals.user?.id, request);
	if (blocked) return blocked;

	const formData = await request.formData();
	const file = getFormFile(formData, 'file');
	const ownerEntity = getFormField(formData, 'ownerEntity');
	const ownerId = getFormField(formData, 'ownerId');
	const docType = getFormField(formData, 'type');

	if (!file) {
		return json({ error: 'No se ha seleccionado archivo' }, { status: 400 });
	}

	if (!(file.type in ALLOWED_TYPES)) {
		return json({ error: 'Tipo de archivo no permitido. Permitidos: JPEG, PNG, WebP, GIF, PDF, XLSX, DOCX' }, { status: 400 });
	}

	if (file.size > MAX_SIZE) {
		return json({ error: 'El archivo supera el tamaño máximo de 10MB' }, { status: 400 });
	}

	const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
	const allowedExts = ALLOWED_TYPES[file.type];
	if (!allowedExts || !allowedExts.includes(fileExt)) {
		return json({ error: `La extensión .${fileExt} no coincide con el tipo ${file.type}` }, { status: 400 });
	}

	const safeExt = mimeToExt(file.type) ?? 'bin';
	const uniqueName = `${randomUUID()}.${safeExt}`;

	const subDir = ownerEntity && SAFE_DIRNAME.test(ownerEntity) ? ownerEntity : 'general';
	const dirPath = join(UPLOAD_DIR, subDir);

	const resolvedDir = resolve(dirPath);
	if (!resolvedDir.startsWith(resolve(UPLOAD_DIR))) {
		return json({ error: 'Directorio no válido' }, { status: 400 });
	}

	await mkdir(dirPath, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	const filePath = join(dirPath, uniqueName);
	await writeFile(filePath, buffer);

	const publicPath = `/uploads/${subDir}/${uniqueName}`;
	const docRows = await db.insert(documents).values({
		organizationId: locals.organizationId,
		ownerEntity: ownerEntity || null,
		ownerId: ownerId || null,
		type: docType || null,
		filename: file.name,
		path: publicPath,
		mimeType: file.type,
		size: file.size
	}).returning();
	const doc = docRows[0];
	if (!doc) return json({ error: 'Error al guardar documento' }, { status: 500 });

	return json({ id: doc.id, path: publicPath, filename: file.name });
};
