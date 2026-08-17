import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { documents } from '$lib/server/db/schema.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = 'static/uploads';
const ALLOWED_TYPES = [
	'image/jpeg', 'image/png', 'image/webp', 'image/gif',
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const ownerEntity = formData.get('ownerEntity') as string | null;
	const ownerId = formData.get('ownerId') as string | null;
	const docType = formData.get('type') as string | null;

	if (!file || file.size === 0) {
		return json({ error: 'No se ha seleccionado archivo' }, { status: 400 });
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return json({ error: 'Tipo de archivo no permitido. Permitidos: JPEG, PNG, WebP, GIF, PDF, XLSX, DOCX' }, { status: 400 });
	}

	if (file.size > MAX_SIZE) {
		return json({ error: 'El archivo supera el tamaño máximo de 10MB' }, { status: 400 });
	}

	const ext = file.name.split('.').pop() || 'bin';
	const uniqueName = `${randomUUID()}.${ext}`;
	const subDir = ownerEntity || 'general';
	const dirPath = join(UPLOAD_DIR, subDir);

	await mkdir(dirPath, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	const filePath = join(dirPath, uniqueName);
	await writeFile(filePath, buffer);

	const publicPath = `/uploads/${subDir}/${uniqueName}`;

	const [doc] = await db.insert(documents).values({
		ownerEntity: ownerEntity || null,
		ownerId: ownerId || null,
		type: docType || null,
		filename: file.name,
		path: publicPath,
		mimeType: file.type,
		size: file.size
	}).returning();

	return json({ id: doc.id, path: publicPath, filename: file.name });
};
