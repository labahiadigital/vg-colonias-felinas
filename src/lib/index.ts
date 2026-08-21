/**
 * Compute a percentage rate, returning 0 when the denominator is 0.
 * Shared across server and client code.
 */
export function computeRate(numerator: number, denominator: number): number {
	return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

/**
 * Safely narrows a JSONB value (unknown) to string[], returning [] if not an array of strings.
 * Replaces `value as string[]` casts on JSONB columns.
 */
export function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((v): v is string => typeof v === 'string');
}

/**
 * Returns the ISO date portion (YYYY-MM-DD) of a Date.
 * Type-safe replacement for `d.toISOString().split('T')[0]`.
 */
export function toDateString(d: Date = new Date()): string {
	return d.toISOString().slice(0, 10);
}

/**
 * Safely narrows an unknown value to Record<string, unknown>.
 * Returns an empty object if the value is not a plain object.
 * Replaces `value as Record<string, unknown>` casts on JSONB details fields.
 */
export function toRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

/**
 * Groups an array of items by a key property, returning Record<string, T[]>.
 * Replaces the repeated manual for-loop grouping pattern found in campaign events,
 * equipment history, and similar parent-child list views.
 */
export function groupByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
	const result: Record<string, T[]> = {};
	for (const item of items) {
		const key = keyFn(item);
		const existing = result[key];
		if (existing) {
			existing.push(item);
		} else {
			result[key] = [item];
		}
	}
	return result;
}

const AUDIT_DETAIL_KEYS = [
	'name', 'cat', 'type', 'format', 'status', 'newStatus',
	'category', 'colony', 'label', 'certNumber', 'priority'
] as const;

/**
 * Formats a JSONB audit-log details field into a human-readable summary.
 * Consolidates the duplicated formatAuditDetails found in informes, configuracion, etc.
 */
export function formatAuditDetails(details: unknown, fallback = ''): string {
	const d = toRecord(details);
	if (Object.keys(d).length === 0) return fallback;
	const parts: string[] = [];
	for (const key of AUDIT_DETAIL_KEYS) {
		const val = d[key];
		if (!val) continue;
		if (key === 'format') {
			parts.push(String(val).toUpperCase());
		} else if (key === 'newStatus') {
			parts.push(`→ ${String(val)}`);
		} else {
			parts.push(String(val));
		}
	}
	return parts.join(' · ') || fallback;
}
