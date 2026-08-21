/**
 * Optimistic UI helper for SvelteKit form actions.
 * Provides immediate visual feedback before server confirms.
 */
export function optimisticEnhance(options: {
	onSubmit?: () => void;
	onSuccess?: () => void;
	onError?: (error: string) => void;
	resetOnSuccess?: boolean;
}) {
	return () => {
		options.onSubmit?.();

		return async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				options.onSuccess?.();
				if (options.resetOnSuccess !== false) await update();
			} else if (result.type === 'failure' || result.type === 'error') {
				const msg = typeof result.data?.error === 'string' ? result.data.error : 'Error inesperado';
				options.onError?.(msg);
				await update();
			} else {
				await update();
			}
		};
	};
}

/**
 * Creates an optimistic list that shows items immediately
 * and reconciles with server response.
 */
export function createOptimisticList<T extends { id: string }>(initial: T[]) {
	let items = $state(initial);
	let pendingAdds: T[] = [];
	let pendingDeletes: Set<string> = new Set();

	return {
		get items() {
			return [
				...items.filter(i => !pendingDeletes.has(i.id)),
				...pendingAdds
			];
		},
		add(item: T) {
			pendingAdds.push(item);
		},
		remove(id: string) {
			pendingDeletes.add(id);
		},
		confirm(serverItems: T[]) {
			items = serverItems;
			pendingAdds = [];
			pendingDeletes.clear();
		},
		rollback() {
			pendingAdds = [];
			pendingDeletes.clear();
		}
	};
}
