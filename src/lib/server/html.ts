export function escHtml(text: string | null | undefined): string {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Shared print-optimised CSS for server-generated reports (export-pdf, subsidy-report).
 * Both consumers import this instead of maintaining their own copy.
 */
export const REPORT_CSS = `
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; }
  h1 { color: #1a5632; font-size: 20px; border-bottom: 3px solid #1a5632; padding-bottom: 8px; }
  h2 { color: #1a5632; font-size: 15px; margin-top: 22px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { color: #1a5632; font-size: 12px; margin-top: 14px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header p { color: #666; margin: 2px 0; font-size: 11px; }
  .meta { background: #f4f7f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 11px; }
  th { background: #1a5632; color: white; padding: 6px 10px; text-align: left; font-size: 10px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .kpi { background: #f4f7f6; border-radius: 6px; padding: 10px; text-align: center; }
  .kpi .value { font-size: 20px; font-weight: bold; color: #1a5632; }
  .kpi .label { font-size: 9px; color: #666; margin-top: 2px; }
  .badge-ok { background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .badge-ko { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .section { page-break-inside: avoid; }
  .summary-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; margin: 12px 0; }
  .footer { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 9px; color: #999; text-align: center; }
  .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-box { width: 45%; border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 10px; }
  .compliance-group { margin: 12px 0; padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #1a5632; }
  .compliance-group h3 { margin-top: 0; }
`;

/**
 * Standard headers for server-generated HTML documents (certificates, reports, credentials).
 * Includes CSP to mitigate residual XSS risk and proper charset declaration.
 */
export function htmlDocHeaders(
	filename?: string,
	disposition: 'inline' | 'attachment' = 'inline'
): HeadersInit {
	const headers: Record<string, string> = {
		'Content-Type': 'text/html; charset=utf-8',
		'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:;",
		'X-Content-Type-Options': 'nosniff'
	};
	if (filename) {
		headers['Content-Disposition'] = `${disposition}; filename="${filename}"`;
	}
	return headers;
}
