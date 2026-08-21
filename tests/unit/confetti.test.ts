import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockConfetti = vi.fn();

vi.mock('canvas-confetti', () => ({
	default: mockConfetti
}));

import { fireConfetti, fireSuccess } from '../../src/lib/utils/confetti.js';

beforeEach(() => {
	mockConfetti.mockClear();
	vi.stubGlobal('requestAnimationFrame', vi.fn());
});

describe('fireConfetti', () => {
	it('calls confetti with correct parameters', async () => {
		await fireConfetti();
		expect(mockConfetti).toHaveBeenCalledWith(
			expect.objectContaining({
				particleCount: 80,
				spread: 70,
				origin: { y: 0.7 }
			})
		);
	});

	it('includes brand colors', async () => {
		await fireConfetti();
		const call = mockConfetti.mock.calls[0][0];
		expect(call.colors).toContain('#0f766e');
		expect(call.colors).toContain('#6366f1');
	});
});

describe('fireSuccess', () => {
	it('calls confetti with left and right origins', async () => {
		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000)
			.mockReturnValue(1300);

		await fireSuccess();
		expect(mockConfetti).toHaveBeenCalledWith(
			expect.objectContaining({ angle: 60, origin: { x: 0 } })
		);
		expect(mockConfetti).toHaveBeenCalledWith(
			expect.objectContaining({ angle: 120, origin: { x: 1 } })
		);
	});
});
