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

// ─── Organizations (Multi-tenant) ───────────────────────────────

export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	type: text('type').notNull().default('municipality'),
	logo: text('logo'),
	primaryColor: text('primary_color').default('#005a4d'),
	timezone: text('timezone').default('Europe/Madrid'),
	locale: text('locale').default('es'),
	address: text('address'),
	city: text('city'),
	province: text('province'),
	country: text('country').default('ES'),
	phone: text('phone'),
	email: text('email'),
	website: text('website'),
	settings: jsonb('settings'),
	smtpHost: text('smtp_host'),
	smtpPort: integer('smtp_port'),
	smtpUser: text('smtp_user'),
	smtpPass: text('smtp_pass'),
	smtpFrom: text('smtp_from'),
	plan: text('plan').notNull().default('standard'),
	maxUsers: integer('max_users').default(50),
	isActive: boolean('is_active').default(true),
	trialEndsAt: timestamp('trial_ends_at'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const organizationMembers = pgTable('organization_members', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	role: text('role').notNull().default('member'),
	joinedAt: timestamp('joined_at').defaultNow()
});

// ─── Users & Auth ───────────────────────────────────────────────

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false),
	image: text('image'),
	language: text('language').notNull().default('es'),
	activeOrganizationId: uuid('active_organization_id'),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	isSystem: boolean('is_system').default(false)
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
		.references(() => roles.id),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' })
});

// ─── Colonies ───────────────────────────────────────────────────

export const colonies = pgTable('colonies', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	schema: jsonb('schema').notNull(),
	scoringWeights: jsonb('scoring_weights'),
	maxScore: integer('max_score'),
	passingScore: integer('passing_score'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow()
});

export const inspections = pgTable('inspections', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	templateId: uuid('template_id').references(() => inspectionTemplates.id),
	colonyId: uuid('colony_id').references(() => colonies.id),
	incidentId: uuid('incident_id').references(() => incidents.id),
	inspectorId: uuid('inspector_id').references(() => users.id),
	results: jsonb('results').notNull(),
	score: doublePrecision('score'),
	passed: boolean('passed'),
	photos: jsonb('photos'),
	notes: text('notes'),
	followUpRequired: boolean('follow_up_required').default(false),
	followUpDate: date('follow_up_date'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Collaborators ──────────────────────────────────────────────

export const collaborators = pgTable('collaborators', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id),
	name: text('name').notNull(),
	documentId: text('document_id'),
	status: text('status').notNull().default('pending'),
	validUntil: date('valid_until'),
	assignedColonies: jsonb('assigned_colonies'),
	privacyNoticeSigned: boolean('privacy_notice_signed').default(false),
	credential: jsonb('credential'),
	photo: text('photo'),
	verificationHash: text('verification_hash'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── Adoptions ──────────────────────────────────────────────────

export const adoptions = pgTable('adoptions', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	title: text('title'),
	type: text('type').notNull().default('direct'),
	colonyId: uuid('colony_id').references(() => colonies.id),
	zone: text('zone'),
	roleFilter: text('role_filter'),
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
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	type: text('type'),
	title: text('title'),
	message: text('message'),
	payload: jsonb('payload'),
	channel: text('channel').default('internal'),
	delivered: boolean('delivered').default(false),
	emailSent: boolean('email_sent').default(false),
	readAt: timestamp('read_at'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Catalogs (Configurable) ────────────────────────────────────

export const catalogs = pgTable('catalogs', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	key: text('key').notNull(),
	label: text('label').notNull(),
	labelEu: text('label_eu'),
	labelCa: text('label_ca'),
	labelEn: text('label_en'),
	sortOrder: integer('sort_order').default(0),
	isActive: boolean('is_active').default(true),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Certificate Templates ──────────────────────────────────────

export const certificateTemplates = pgTable('certificate_templates', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	name: text('name').notNull(),
	headerHtml: text('header_html'),
	footerHtml: text('footer_html'),
	bodyTemplate: text('body_template'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Email Templates ────────────────────────────────────────────

export const emailTemplates = pgTable('email_templates', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	key: text('key').notNull(),
	subject: text('subject').notNull(),
	bodyHtml: text('body_html').notNull(),
	bodyText: text('body_text'),
	locale: text('locale').default('es'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Data Retention ─────────────────────────────────────────────

export const dataRetentionPolicies = pgTable('data_retention_policies', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	entity: text('entity').notNull(),
	retentionDays: integer('retention_days').notNull(),
	action: text('action').notNull().default('anonymize'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Visits / Activity Logging ──────────────────────────────────

export const visits = pgTable('visits', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	colonyId: uuid('colony_id').references(() => colonies.id),
	userId: uuid('user_id').references(() => users.id),
	collaboratorId: uuid('collaborator_id').references(() => collaborators.id),
	type: text('type').notNull().default('feeding'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	durationMinutes: integer('duration_minutes'),
	notes: text('notes'),
	photos: jsonb('photos'),
	catsObserved: integer('cats_observed'),
	foodProvided: boolean('food_provided').default(false),
	waterProvided: boolean('water_provided').default(false),
	incidentDetected: boolean('incident_detected').default(false),
	visitedAt: timestamp('visited_at').defaultNow(),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Volunteer Hours ────────────────────────────────────────────

export const volunteerHours = pgTable('volunteer_hours', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id),
	collaboratorId: uuid('collaborator_id').references(() => collaborators.id),
	colonyId: uuid('colony_id').references(() => colonies.id),
	visitId: uuid('visit_id').references(() => visits.id),
	hours: doublePrecision('hours').notNull(),
	activityType: text('activity_type').notNull(),
	date: date('date').notNull(),
	verified: boolean('verified').default(false),
	verifiedBy: uuid('verified_by').references(() => users.id),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Providers (Veterinarios, Clínicas, Servicios) ──────────────

export const providers = pgTable('providers', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: text('type').notNull().default('veterinary'),
	contactPerson: text('contact_person'),
	email: text('email'),
	phone: text('phone'),
	address: text('address'),
	city: text('city'),
	specializations: jsonb('specializations'),
	licenseNumber: text('license_number'),
	contractStart: date('contract_start'),
	contractEnd: date('contract_end'),
	status: text('status').notNull().default('active'),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const providerInterventions = pgTable('provider_interventions', {
	id: uuid('id').primaryKey().defaultRandom(),
	providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	catId: uuid('cat_id').references(() => cats.id),
	colonyId: uuid('colony_id').references(() => colonies.id),
	type: text('type').notNull(),
	description: text('description'),
	cost: doublePrecision('cost'),
	performedAt: timestamp('performed_at').notNull(),
	invoiceRef: text('invoice_ref'),
	createdAt: timestamp('created_at').defaultNow()
});

// ─── Subsidy Reports (Memorias de Subvención) ──────────────────

export const subsidyReports = pgTable('subsidy_reports', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	type: text('type').notNull().default('dgda'),
	periodStart: date('period_start').notNull(),
	periodEnd: date('period_end').notNull(),
	status: text('status').notNull().default('draft'),
	data: jsonb('data'),
	generatedBy: uuid('generated_by').references(() => users.id),
	approvedBy: uuid('approved_by').references(() => users.id),
	approvedAt: timestamp('approved_at'),
	documentPath: text('document_path'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── Audit Logs ─────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id),
	entity: text('entity').notNull(),
	entityId: text('entity_id').notNull(),
	action: text('action').notNull(),
	details: jsonb('details'),
	ipAddress: text('ip_address'),
	createdAt: timestamp('created_at').defaultNow()
});
