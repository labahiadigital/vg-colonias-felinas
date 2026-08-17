<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';

	let {
		content = '',
		placeholder = 'Escribe aquí...',
		onchange,
		name = '',
		label = '',
		minHeight = '120px'
	}: {
		content?: string;
		placeholder?: string;
		onchange?: (html: string) => void;
		name?: string;
		label?: string;
		minHeight?: string;
	} = $props();

	let editorEl = $state<HTMLDivElement>();
	let editor: Editor | null = null;
	let htmlValue = $state(content);

	onMount(() => {
		if (!editorEl) return;
		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit,
				Placeholder.configure({ placeholder })
			],
			content,
			editorProps: {
				attributes: {
					class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2.5 text-sm text-text'
				}
			},
			onUpdate: ({ editor: e }) => {
				htmlValue = e.getHTML();
				onchange?.(htmlValue);
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	function toggleBold() { editor?.chain().focus().toggleBold().run(); }
	function toggleItalic() { editor?.chain().focus().toggleItalic().run(); }
	function toggleBulletList() { editor?.chain().focus().toggleBulletList().run(); }
	function toggleOrderedList() { editor?.chain().focus().toggleOrderedList().run(); }
	function toggleHeading() { editor?.chain().focus().toggleHeading({ level: 3 }).run(); }
	function toggleBlockquote() { editor?.chain().focus().toggleBlockquote().run(); }
</script>

<div class="rich-text-editor">
	{#if label}
		<label class="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
	{/if}

	<!-- Toolbar -->
	<div class="flex items-center gap-0.5 px-2 py-1.5 bg-surface-sunken border border-border border-b-0 rounded-t-lg">
		<button type="button" onclick={toggleBold} class="p-1.5 rounded hover:bg-border transition-colors" aria-label="Negrita" data-tooltip="Negrita">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 text-text-secondary"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
		</button>
		<button type="button" onclick={toggleItalic} class="p-1.5 rounded hover:bg-border transition-colors" aria-label="Cursiva" data-tooltip="Cursiva">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-secondary"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
		</button>
		<div class="w-px h-4 bg-border mx-1"></div>
		<button type="button" onclick={toggleHeading} class="p-1.5 rounded hover:bg-border transition-colors" aria-label="Título" data-tooltip="Título">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-secondary"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 12l3-2v8"/></svg>
		</button>
		<button type="button" onclick={toggleBulletList} class="p-1.5 rounded hover:bg-border transition-colors" aria-label="Lista" data-tooltip="Lista">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-secondary"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
		</button>
		<button type="button" onclick={toggleOrderedList} class="p-1.5 rounded hover:bg-border transition-colors" aria-label="Lista numerada" data-tooltip="Lista numerada">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-secondary"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="8" fill="currentColor" stroke="none">1</text><text x="2" y="14" font-size="8" fill="currentColor" stroke="none">2</text><text x="2" y="20" font-size="8" fill="currentColor" stroke="none">3</text></svg>
		</button>
		<button type="button" onclick={toggleBlockquote} class="p-1.5 rounded hover:bg-border transition-colors" aria-label="Cita" data-tooltip="Cita">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-secondary"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
		</button>
	</div>

	<!-- Editor -->
	<div
		bind:this={editorEl}
		class="bg-background border border-border rounded-b-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors"
		style="min-height: {minHeight}"
	></div>

	{#if name}
		<input type="hidden" {name} value={htmlValue} />
	{/if}
</div>

<style>
	.rich-text-editor :global(.ProseMirror) {
		min-height: inherit;
	}
	.rich-text-editor :global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: var(--color-text-muted);
		pointer-events: none;
		height: 0;
	}
	.rich-text-editor :global(.ProseMirror h3) {
		font-size: 1rem;
		font-weight: 600;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
	}
	.rich-text-editor :global(.ProseMirror ul),
	.rich-text-editor :global(.ProseMirror ol) {
		padding-left: 1.25rem;
		margin: 0.25rem 0;
	}
	.rich-text-editor :global(.ProseMirror blockquote) {
		border-left: 3px solid var(--color-border);
		padding-left: 0.75rem;
		margin: 0.5rem 0;
		color: var(--color-text-secondary);
	}
</style>
