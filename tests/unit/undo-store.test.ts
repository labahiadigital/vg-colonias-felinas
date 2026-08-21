import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('undo store', () => {
	it('subscribe calls listener immediately and scheduleWithUndo notifies', async () => {
		const { subscribe, scheduleWithUndo } = await import('../../src/lib/stores/undo.js');
		const listener = vi.fn();
		const unsub = subscribe(listener);
		expect(listener).toHaveBeenCalledTimes(1);

		scheduleWithUndo({
			message: 'Delete item',
			execute: vi.fn(),
			undo: vi.fn()
		});
		expect(listener).toHaveBeenCalledTimes(2);
		unsub();
	});

	it('scheduleWithUndo uses custom id', async () => {
		const { scheduleWithUndo } = await import('../../src/lib/stores/undo.js');
		const id = scheduleWithUndo({
			id: 'custom-id',
			message: 'test',
			execute: vi.fn(),
			undo: vi.fn()
		});
		expect(id).toBe('custom-id');
	});

	it('cancelAction calls undo callback', async () => {
		const { scheduleWithUndo, cancelAction } = await import('../../src/lib/stores/undo.js');
		const undo = vi.fn();
		const id = scheduleWithUndo({
			message: 'test',
			execute: vi.fn(),
			undo,
			delayMs: 10000
		});
		await cancelAction(id);
		expect(undo).toHaveBeenCalledOnce();
	});

	it('cancelAction does nothing for unknown id', async () => {
		const { cancelAction } = await import('../../src/lib/stores/undo.js');
		await expect(cancelAction('nonexistent')).resolves.toBeUndefined();
	});

	it('dismissAction executes immediately', async () => {
		const { scheduleWithUndo, dismissAction } = await import('../../src/lib/stores/undo.js');
		const execute = vi.fn();
		const id = scheduleWithUndo({
			message: 'test',
			execute,
			undo: vi.fn(),
			delayMs: 10000
		});
		await dismissAction(id);
		expect(execute).toHaveBeenCalledOnce();
	});

	it('dismissAction does nothing for unknown id', async () => {
		const { dismissAction } = await import('../../src/lib/stores/undo.js');
		await expect(dismissAction('nonexistent')).resolves.toBeUndefined();
	});

	it('unsubscribe stops notifications', async () => {
		const { subscribe, scheduleWithUndo } = await import('../../src/lib/stores/undo.js');
		const listener = vi.fn();
		const unsub = subscribe(listener);
		const callsBefore = listener.mock.calls.length;
		unsub();
		scheduleWithUndo({
			message: 'after unsub',
			execute: vi.fn(),
			undo: vi.fn()
		});
		expect(listener.mock.calls.length).toBe(callsBefore);
	});
});
