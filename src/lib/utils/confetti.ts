async function loadConfetti() {
	try {
		return (await import('canvas-confetti')).default;
	} catch {
		return null;
	}
}

export async function fireConfetti() {
	const confetti = await loadConfetti();
	confetti?.({
		particleCount: 80,
		spread: 70,
		origin: { y: 0.7 },
		colors: ['#0f766e', '#6366f1', '#10b981', '#f59e0b']
	});
}

export async function fireSuccess() {
	const confetti = await loadConfetti();
	if (!confetti) return;
	const end = Date.now() + 200;

	(function frame() {
		confetti({
			particleCount: 3,
			angle: 60,
			spread: 55,
			origin: { x: 0 },
			colors: ['#0f766e', '#10b981']
		});
		confetti({
			particleCount: 3,
			angle: 120,
			spread: 55,
			origin: { x: 1 },
			colors: ['#6366f1', '#818cf8']
		});

		if (Date.now() < end) requestAnimationFrame(frame);
	})();
}
