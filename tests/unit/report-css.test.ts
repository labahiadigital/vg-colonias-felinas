import { describe, it, expect } from 'vitest';
import { REPORT_CSS } from '../../src/lib/server/html.js';

describe('REPORT_CSS', () => {
	it('is a non-empty string', () => {
		expect(typeof REPORT_CSS).toBe('string');
		expect(REPORT_CSS.length).toBeGreaterThan(100);
	});

	it('contains @page rule for A4 printing', () => {
		expect(REPORT_CSS).toContain('@page');
		expect(REPORT_CSS).toContain('A4');
	});

	it('contains body font-family declaration', () => {
		expect(REPORT_CSS).toContain('body');
		expect(REPORT_CSS).toContain('font-family');
	});

	it('contains brand color #1a5632', () => {
		expect(REPORT_CSS).toContain('#1a5632');
	});

	it('contains table styling', () => {
		expect(REPORT_CSS).toContain('table');
		expect(REPORT_CSS).toContain('border-collapse');
	});

	it('contains KPI grid layout', () => {
		expect(REPORT_CSS).toContain('.kpi-grid');
		expect(REPORT_CSS).toContain('grid-template-columns');
	});

	it('contains badge classes for pass/fail indicators', () => {
		expect(REPORT_CSS).toContain('.badge-ok');
		expect(REPORT_CSS).toContain('.badge-ko');
	});

	it('contains page-break-inside avoid for sections', () => {
		expect(REPORT_CSS).toContain('.section');
		expect(REPORT_CSS).toContain('page-break-inside');
	});

	it('contains footer and signature area styling', () => {
		expect(REPORT_CSS).toContain('.footer');
		expect(REPORT_CSS).toContain('.signature-area');
		expect(REPORT_CSS).toContain('.signature-box');
	});

	it('contains compliance group styling', () => {
		expect(REPORT_CSS).toContain('.compliance-group');
	});
});
