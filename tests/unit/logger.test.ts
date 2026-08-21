import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, correlationIdFromRequest, requestLogger, requestTimer, metricsCollector } from '../../src/lib/server/logger.js';

describe('createLogger', () => {
	it('creates a logger with all standard methods', () => {
		const log = createLogger('test');
		expect(typeof log.debug).toBe('function');
		expect(typeof log.info).toBe('function');
		expect(typeof log.warn).toBe('function');
		expect(typeof log.error).toBe('function');
		expect(typeof log.child).toBe('function');
		expect(log.correlationId).toBeDefined();
		expect(log.correlationId.length).toBeGreaterThan(0);
	});

	it('uses provided correlation ID', () => {
		const log = createLogger('test', 'custom-id-123');
		expect(log.correlationId).toBe('custom-id-123');
	});

	it('generates a UUID correlation ID when not provided', () => {
		const log = createLogger('test');
		expect(log.correlationId).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('child logger inherits correlation ID', () => {
		const parent = createLogger('parent', 'parent-cid');
		const child = parent.child('sub');
		expect(child.correlationId).toBe('parent-cid');
	});

	it('logs to console.error for error level', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const log = createLogger('test', 'err-cid');
		log.error('something failed', { code: 500 });
		expect(spy).toHaveBeenCalledOnce();
		const output = spy.mock.calls[0]![0] as string;
		expect(output).toContain('err-cid');
		expect(output).toContain('something failed');
		spy.mockRestore();
	});

	it('logs to console.warn for warn level', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const log = createLogger('test', 'warn-cid');
		log.warn('heads up');
		expect(spy).toHaveBeenCalledOnce();
		spy.mockRestore();
	});

	it('logs to console.log for info level', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'info-cid');
		log.info('operation complete');
		expect(spy).toHaveBeenCalledOnce();
		spy.mockRestore();
	});

	it('includes module name in output', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('myModule', 'mod-cid');
		log.info('hello');
		const output = spy.mock.calls[0]![0] as string;
		expect(output).toContain('myModule');
		spy.mockRestore();
	});

	it('includes data object in output', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'data-cid');
		log.info('with data', { userId: 'u1', action: 'login' });
		const output = spy.mock.calls[0]![0] as string;
		expect(output).toContain('userId');
		expect(output).toContain('u1');
		spy.mockRestore();
	});
});

describe('correlationIdFromRequest', () => {
	it('extracts x-request-id header from request', () => {
		const req = new Request('http://localhost', {
			headers: { 'x-request-id': 'req-abc-123' }
		});
		expect(correlationIdFromRequest(req)).toBe('req-abc-123');
	});

	it('generates UUID when header is absent', () => {
		const req = new Request('http://localhost');
		const id = correlationIdFromRequest(req);
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('generates UUID when no request provided', () => {
		const id = correlationIdFromRequest();
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe('requestLogger', () => {
	it('creates a logger from a request with x-request-id', () => {
		const req = new Request('http://localhost', {
			headers: { 'x-request-id': 'rl-test-id' }
		});
		const log = requestLogger('api', req);
		expect(log.correlationId).toBe('rl-test-id');
	});

	it('creates a logger with auto-generated ID when no header', () => {
		const log = requestLogger('api', new Request('http://localhost'));
		expect(log.correlationId).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe('requestTimer', () => {
	beforeEach(() => metricsCollector.reset());

	it('returns a finish function', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'timer-cid');
		const req = new Request('http://localhost/api/test', { method: 'GET' });
		const done = requestTimer(log, req);
		expect(typeof done).toBe('function');
		spy.mockRestore();
	});

	it('logs request completed with method, url, statusCode, durationMs', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'timer-cid-2');
		const req = new Request('http://localhost/api/colonias', { method: 'POST' });
		const done = requestTimer(log, req);
		done(201);
		expect(spy).toHaveBeenCalledOnce();
		const output = spy.mock.calls[0]![0] as string;
		expect(output).toContain('request completed');
		expect(output).toContain('POST');
		expect(output).toContain('/api/colonias');
		expect(output).toContain('201');
		expect(output).toContain('durationMs');
		spy.mockRestore();
	});

	it('records metrics in metricsCollector', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'mc-cid');
		const req = new Request('http://localhost/api/test');
		const done = requestTimer(log, req);
		done(200);

		const metrics = metricsCollector.getMetrics();
		expect(metrics.totalRequests).toBe(1);
		expect(metrics.statusCounts['200']).toBe(1);
		expect(metrics.avgDurationMs).toBeGreaterThanOrEqual(0);
		spy.mockRestore();
	});
});

describe('metricsCollector', () => {
	beforeEach(() => metricsCollector.reset());

	it('tracks total requests', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'met-cid');
		const done1 = requestTimer(log, new Request('http://localhost/a'));
		done1(200);
		const done2 = requestTimer(log, new Request('http://localhost/b'));
		done2(404);
		const done3 = requestTimer(log, new Request('http://localhost/c'));
		done3(200);

		const m = metricsCollector.getMetrics();
		expect(m.totalRequests).toBe(3);
		expect(m.statusCounts['200']).toBe(2);
		expect(m.statusCounts['404']).toBe(1);
		spy.mockRestore();
	});

	it('reset clears all metrics', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'reset-cid');
		const done = requestTimer(log, new Request('http://localhost/a'));
		done(200);
		metricsCollector.reset();

		const m = metricsCollector.getMetrics();
		expect(m.totalRequests).toBe(0);
		expect(m.avgDurationMs).toBe(0);
		spy.mockRestore();
	});

	it('calculates p95 and p99 percentiles', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const log = createLogger('test', 'pct-cid');
		for (let i = 0; i < 100; i++) {
			const done = requestTimer(log, new Request('http://localhost/perf'));
			done(200);
		}

		const m = metricsCollector.getMetrics();
		expect(m.p95DurationMs).toBeGreaterThanOrEqual(0);
		expect(m.p99DurationMs).toBeGreaterThanOrEqual(0);
		expect(m.p99DurationMs).toBeGreaterThanOrEqual(m.p95DurationMs);
		spy.mockRestore();
	});
});
