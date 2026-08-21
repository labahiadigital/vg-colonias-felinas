/**
 * Structured logger with correlation ID support.
 *
 * Each request gets a correlation ID (from x-request-id header or auto-generated)
 * that travels through all log entries for that request, enabling end-to-end tracing.
 *
 * Output format: JSON lines suitable for log aggregation (Datadog, ELK, CloudWatch).
 * In development, falls back to human-readable console output.
 */

import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	correlationId: string;
	module: string;
	message: string;
	data?: Record<string, unknown>;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

function parseLogLevel(raw: string | undefined): LogLevel {
	if (raw && raw in LEVEL_PRIORITY) return raw as LogLevel;
	return IS_PRODUCTION ? 'info' : 'debug';
}

const MIN_LEVEL: LogLevel = parseLogLevel(process.env.LOG_LEVEL);

function shouldLog(level: LogLevel): boolean {
	return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
	if (IS_PRODUCTION) {
		return JSON.stringify(entry);
	}
	const prefix = `[${entry.level.toUpperCase()}] [${entry.correlationId.slice(0, 8)}] [${entry.module}]`;
	const suffix = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
	return `${prefix} ${entry.message}${suffix}`;
}

function emit(entry: LogEntry): void {
	const formatted = formatEntry(entry);
	switch (entry.level) {
		case 'error':
			console.error(formatted);
			break;
		case 'warn':
			console.warn(formatted);
			break;
		default:
			console.log(formatted);
	}
}

export interface Logger {
	debug(message: string, data?: Record<string, unknown>): void;
	info(message: string, data?: Record<string, unknown>): void;
	warn(message: string, data?: Record<string, unknown>): void;
	error(message: string, data?: Record<string, unknown>): void;
	child(module: string): Logger;
	readonly correlationId: string;
}

function createLogMethod(correlationId: string, module: string, level: LogLevel) {
	return (message: string, data?: Record<string, unknown>): void => {
		if (!shouldLog(level)) return;
		emit({
			timestamp: new Date().toISOString(),
			level,
			correlationId,
			module,
			message,
			data
		});
	};
}

export function createLogger(module: string, correlationId?: string): Logger {
	const id = correlationId ?? randomUUID();
	return {
		debug: createLogMethod(id, module, 'debug'),
		info: createLogMethod(id, module, 'info'),
		warn: createLogMethod(id, module, 'warn'),
		error: createLogMethod(id, module, 'error'),
		correlationId: id,
		child(childModule: string): Logger {
			return createLogger(`${module}.${childModule}`, id);
		}
	};
}

/**
 * Extracts or generates a correlation ID from a request.
 * Uses x-request-id header if present, otherwise generates a UUID.
 */
export function correlationIdFromRequest(request?: Request): string {
	return request?.headers.get('x-request-id') ?? randomUUID();
}

/**
 * Creates a request-scoped logger from an incoming request.
 */
export function requestLogger(module: string, request?: Request): Logger {
	return createLogger(module, correlationIdFromRequest(request));
}

/**
 * Tracks request duration and emits a structured log entry on completion.
 * Returns a finish function that logs the final metrics.
 *
 * Usage in hooks or endpoints:
 *   const done = requestTimer(log, request);
 *   // ... handle request ...
 *   done(response.status);
 */
export function requestTimer(
	logger: Logger,
	request: Request
): (statusCode: number) => void {
	const startMs = performance.now();
	const method = request.method;
	const url = new URL(request.url).pathname;

	return (statusCode: number) => {
		const durationMs = Math.round(performance.now() - startMs);
		logger.info('request completed', {
			method,
			url,
			statusCode,
			durationMs
		});

		metricsCollector.record(method, url, statusCode, durationMs);
	};
}

/**
 * In-memory metrics collector for request counters and latency.
 * Designed for lightweight observability; can be replaced with
 * Prometheus/Datadog client in production.
 */
export interface RequestMetrics {
	totalRequests: number;
	statusCounts: Record<string, number>;
	avgDurationMs: number;
	p95DurationMs: number;
	p99DurationMs: number;
}

class MetricsCollector {
	private durations: number[] = [];
	private statusCounts = new Map<number, number>();
	private total = 0;

	record(_method: string, _url: string, statusCode: number, durationMs: number): void {
		this.total++;
		this.durations.push(durationMs);
		this.statusCounts.set(statusCode, (this.statusCounts.get(statusCode) ?? 0) + 1);

		if (this.durations.length > 10_000) {
			this.durations = this.durations.slice(-5_000);
		}
	}

	getMetrics(): RequestMetrics {
		const sorted = [...this.durations].sort((a, b) => a - b);
		const len = sorted.length;
		return {
			totalRequests: this.total,
			statusCounts: Object.fromEntries(this.statusCounts),
			avgDurationMs: len > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / len) : 0,
			p95DurationMs: len > 0 ? (sorted[Math.floor(len * 0.95)] ?? 0) : 0,
			p99DurationMs: len > 0 ? (sorted[Math.floor(len * 0.99)] ?? 0) : 0
		};
	}

	reset(): void {
		this.durations = [];
		this.statusCounts.clear();
		this.total = 0;
	}
}

export const metricsCollector = new MetricsCollector();
