type UndoCallback = () => void | Promise<void>;

interface PendingAction {
	id: string;
	message: string;
	execute: () => void | Promise<void>;
	undo: UndoCallback;
	timer: ReturnType<typeof setTimeout>;
}

let actions: PendingAction[] = [];
let listeners: Array<(actions: PendingAction[]) => void> = [];

function notify() {
	listeners.forEach(fn => fn([...actions]));
}

export function subscribe(fn: (actions: PendingAction[]) => void) {
	listeners.push(fn);
	fn([...actions]);
	return () => { listeners = listeners.filter(l => l !== fn); };
}

export function scheduleWithUndo(opts: {
	id?: string;
	message: string;
	execute: () => void | Promise<void>;
	undo: UndoCallback;
	delayMs?: number;
}) {
	const id = opts.id ?? crypto.randomUUID();
	const delayMs = opts.delayMs ?? 5000;

	const timer = setTimeout(async () => {
		await opts.execute();
		actions = actions.filter(a => a.id !== id);
		notify();
	}, delayMs);

	const action: PendingAction = {
		id,
		message: opts.message,
		execute: opts.execute,
		undo: opts.undo,
		timer
	};

	actions = [...actions, action];
	notify();

	return id;
}

export async function cancelAction(id: string) {
	const action = actions.find(a => a.id === id);
	if (action) {
		clearTimeout(action.timer);
		await action.undo();
		actions = actions.filter(a => a.id !== id);
		notify();
	}
}

export async function dismissAction(id: string) {
	const action = actions.find(a => a.id === id);
	if (action) {
		clearTimeout(action.timer);
		await action.execute();
		actions = actions.filter(a => a.id !== id);
		notify();
	}
}
