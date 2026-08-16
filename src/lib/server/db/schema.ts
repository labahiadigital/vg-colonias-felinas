import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	integer,
	jsonb,
	date,
	doublePrecision,
	serial
} from 'drizzle-orm/pg-core';

// ─── Users & Auth ───────────────────────────────────────────────

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false),
	image: text('image'),
	language: text('language').notNull().default('es'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').unique(),
	expiresAt: timestamp('expires_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const accounts = pgTable('accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const verifications = pgTable('verifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── RBAC ───────────────────────────────────────────────────────

export const roles = pgTable('roles', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description')
});

export const permissions = pgTable('permissions', {
	id: serial('id').primaryKey(),
	module: text('module').notNull(),
	action: text('action').notNull()
});

export const rolePermissions = pgTable('role_permissions', {
	roleId: integer('role_id')
		.notNull()
		.references(() => roles.id),
	permissionId: integer('permission_id')
		.notNull()
		.references(() => permissions.id)
});

export const userRoles = pgTable('user_roles', {
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	roleId: integer('role_id')
		.notNull()
		.references(() => roles.id)
});

// ─── Colonies ───────────────────────────────────────────────────

export const colonies = pgTable('colonies', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	status: text('status').notNull().default('active'),
	classification: text('classification'),
	district: text('district'),
	description: text('description'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	geojson: jsonb('geojson'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const feedingPoints = pgTable('feeding_points', {
	id: uuid('id').primaryKey().defaultRandom(),
	colonyId: uuid('colony_id')
		.notNull()
		.references(() => colonies.id, { onDelete: 'cascade' }),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull(),
	notes: text('notes'),
	recordedAt: timestamp('recorded_at').defaultNow()
});

// ─── Cats ───────────────────────────────────────────────────────

export const cats = pgTable('cats', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name'),
	colonyId: uuid('colony_id').references(() => colonies.id),
	sex: text('sex'),
	sterilized: boolean('sterilized').default(false),
	sterilizationDate: date('sterilization_date'),
	microchip: text('microchip').unique(),
	status: text('status').notNull().default('in_colony'),
	photo: text('photo'),
	estimatedAge: text('estimated_age'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── Health Records ─────────────────────────────────────────────

export const healthRecords = pgTable('health_records', {
	id: uuid('id').primaryKey().defaultRandom(),
	catId: uuid('cat_id')
		.notNull()
		.references(() => cats.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	performedAt: timestamp('performed_at').notNull(),
	vetName: text('vet_name'),
	vetClinic: text('vet_clinic'),
	notes: text('notes'),
	attachments: jsonb('attachments'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── CER Actions ────────────────────────────────────────────────

export const cerActions = pgTable('cer_actions', {
	id: uuid('id').primaryKey().defaultRandom(),
	catId: uuid('cat_id')
		.notNull()
		.references(() => cats.id),
	colonyId: uuid('colony_id')
		.notNull()
		.references(() => colonies.id),
	capturedAt: timestamp('captured_at'),
	sterilizedAt: timestamp('sterilized_at'),
	returnedAt: timestamp('returned_at'),
	collaboratorName: text('collaborator_name'),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Incidents ──────────────────────────────────────────────────

export const incidents = pgTable('incidents', {
	id: uuid('id').primaryKey().defaultRandom(),
	colonyId: uuid('colony_id').references(() => colonies.id),
	catId: uuid('cat_id').references(() => cats.id),
	category: text('category').notNull(),
	priority: text('priority').notNull().default('medium'),
	status: text('status').notNull().default('open'),
	description: text('description'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	reportedBy: uuid('reported_by').references(() => users.id),
	assignedTo: uuid('assigned_to').references(() => users.id),
	photos: jsonb('photos'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── Inspections ────────────────────────────────────────────────

export const inspectionTemplates = pgTable('inspection_templates', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	schema: jsonb('schema').notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const inspections = pgTable('inspections', {
	id: uuid('id').primaryKey().defaultRandom(),
	templateId: uuid('template_id').references(() => inspectionTemplates.id),
	colonyId: uuid('colony_id').references(() => colonies.id),
	incidentId: uuid('incident_id').references(() => incidents.id),
	inspectorId: uuid('inspector_id').references(() => users.id),
	results: jsonb('results').notNull(),
	photos: jsonb('photos'),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Collaborators ──────────────────────────────────────────────

export const collaborators = pgTable('collaborators', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	name: text('name').notNull(),
	documentId: text('document_id'),
	status: text('status').notNull().default('pending'),
	validUntil: date('valid_until'),
	assignedColonies: jsonb('assigned_colonies'),
	privacyNoticeSigned: boolean('privacy_notice_signed').default(false),
	credential: jsonb('credential'),
	photo: text('photo'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── Adoptions ──────────────────────────────────────────────────

export const adoptions = pgTable('adoptions', {
	id: uuid('id').primaryKey().defaultRandom(),
	catId: uuid('cat_id')
		.notNull()
		.references(() => cats.id),
	adopterInfo: jsonb('adopter_info'),
	consent: jsonb('consent'),
	status: text('status').notNull().default('pending'),
	adoptedAt: timestamp('adopted_at'),
	documents: jsonb('documents'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Documents ──────────────────────────────────────────────────

export const documents = pgTable('documents', {
	id: uuid('id').primaryKey().defaultRandom(),
	ownerEntity: text('owner_entity'),
	ownerId: uuid('owner_id'),
	type: text('type'),
	filename: text('filename').notNull(),
	path: text('path').notNull(),
	mimeType: text('mime_type'),
	size: integer('size'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Chat & Notifications ───────────────────────────────────────

export const conversations = pgTable('conversations', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title'),
	participants: jsonb('participants'),
	createdAt: timestamp('created_at').defaultNow()
});

export const messages = pgTable('messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	conversationId: uuid('conversation_id')
		.notNull()
		.references(() => conversations.id, { onDelete: 'cascade' }),
	senderId: uuid('sender_id')
		.notNull()
		.references(() => users.id),
	content: text('content'),
	sentAt: timestamp('sent_at').defaultNow()
});

export const notifications = pgTable('notifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	type: text('type'),
	title: text('title'),
	message: text('message'),
	payload: jsonb('payload'),
	delivered: boolean('delivered').default(false),
	readAt: timestamp('read_at'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Audit Logs ─────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	entity: text('entity').notNull(),
	entityId: text('entity_id').notNull(),
	action: text('action').notNull(),
	details: jsonb('details'),
	ipAddress: text('ip_address'),
	createdAt: timestamp('created_at').defaultNow()
});
