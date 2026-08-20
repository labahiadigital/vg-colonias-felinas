import { describe, it, expect, vi } from 'vitest';
import { optimisticEnhance } from '../../src/lib/utils/optimistic.js';

describe('optimisticEnhance', () => {
	it('returns a function', () => {
		const enhancer = optimisticEnhance({});
		expect(typeof enhancer).toBe('function');
	});

	it('calls onSubmit when invoked', () => {
		const onSubmit = vi.fn();
		const enhancer = optimisticEnhance({ onSubmit });
		enhancer();
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('returns async handler from invocation', () => {
		const enhancer = optimisticEnhance({});
		const handler = enhancer();
		expect(typeof handler).toBe('function');
	});

	it('calls onSuccess on success result', async () => {
		const onSuccess = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		const enhancer = optimisticEnhance({ onSuccess, resetOnSuccess: true });
		const handler = enhancer();
		await handler({ result: { type: 'success' }, update });
		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalled();
	});

	it('does not call update on success when resetOnSuccess is false', async () => {
		const onSuccess = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		const enhancer = optimisticEnhance({ onSuccess, resetOnSuccess: false });
		const handler = enhancer();
		await handler({ result: { type: 'success' }, update });
		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(update).not.toHaveBeenCalled();
	});

	it('calls onError on failure result', async () => {
		const onError = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		const enhancer = optimisticEnhance({ onError });
		const handler = enhancer();
		await handler({ result: { type: 'failure', data: { error: 'Bad request' } }, update });
		expect(onError).toHaveBeenCalledWith('Bad request');
		expect(update).toHaveBeenCalled();
	});

	it('calls onError with default message on error without data', async () => {
		const onError = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		const enhancer = optimisticEnhance({ onError });
		const handler = enhancer();
		await handler({ result: { type: 'error' }, update });
		expect(onError).toHaveBeenCalledWith('Error inesperado');
	});

	it('calls update on redirect result', async () => {
		const update = vi.fn().mockResolvedValue(undefined);
		const enhancer = optimisticEnhance({});
		const handler = enhancer();
		await handler({ result: { type: 'redirect' }, update });
		expect(update).toHaveBeenCalled();
	});
});
