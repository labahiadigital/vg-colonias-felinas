<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewConversation = $state(false);
	let activeTab = $state<'conversations' | 'notifications'>('conversations');
	let selectedConversation = $state<string | null>(null);

	let unreadCount = $derived(data.notifications?.filter((n: { readAt: unknown }) => !n.readAt).length || 0);
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'messages.title')}</h2>
			<p class="text-sm text-gray-500">
				{data.conversations.length} conversaciones
				{#if unreadCount > 0}
					&middot; <span class="text-orange-600 font-semibold">{unreadCount} notificaciones sin leer</span>
				{/if}
			</p>
		</div>
		<button onclick={() => showNewConversation = !showNewConversation}
			class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
			{showNewConversation ? 'Cancelar' : `+ ${t(locale, 'messages.new_conversation')}`}
		</button>
	</div>

	{#if showNewConversation}
		<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
			<h3 class="font-bold text-lg mb-4">{t(locale, 'messages.new_conversation')}</h3>
			<form method="POST" action="?/createConversation" use:enhance class="grid gap-4">
				<div>
					<label for="title" class="block text-sm font-semibold mb-1">Título</label>
					<input type="text" name="title" id="title" required class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<span class="block text-sm font-semibold mb-1">Participantes</span>
					<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
						{#each data.users as u}
							<label class="flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-1.5 rounded border cursor-pointer hover:bg-gray-100">
								<input type="checkbox" name="participants" value={u.id} />
								{u.name}
							</label>
						{/each}
					</div>
				</div>
				<button type="submit" class="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark w-fit">{t(locale, 'common.save')}</button>
			</form>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">Conversación creada.</div>
	{/if}

	<!-- Tabs -->
	<div class="flex gap-2 mb-4">
		<button onclick={() => activeTab = 'conversations'}
			class="px-4 py-2 rounded-md text-sm font-semibold {activeTab === 'conversations' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}">
			Conversaciones
		</button>
		<button onclick={() => activeTab = 'notifications'}
			class="px-4 py-2 rounded-md text-sm font-semibold {activeTab === 'notifications' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}">
			{t(locale, 'messages.notifications')}
			{#if unreadCount > 0}
				<span class="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
			{/if}
		</button>
	</div>

	{#if activeTab === 'conversations'}
		<div class="grid md:grid-cols-3 gap-4">
			<!-- Conversations list -->
			<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
				<div class="divide-y">
					{#each data.conversations as convo}
						<button onclick={() => selectedConversation = convo.id}
							class="w-full text-left px-4 py-3 hover:bg-gray-50 {selectedConversation === convo.id ? 'bg-primary/5 border-l-4 border-primary' : ''}">
							<p class="font-semibold text-sm">{convo.title || 'Sin título'}</p>
							{#if convo.lastMessage}
								<p class="text-xs text-gray-500 truncate mt-0.5">{convo.lastMessage.senderName}: {convo.lastMessage.content}</p>
								<p class="text-xs text-gray-400 mt-0.5">{convo.lastMessage.sentAt ? new Date(convo.lastMessage.sentAt).toLocaleDateString('es-ES') : ''}</p>
							{:else}
								<p class="text-xs text-gray-400 mt-0.5">Sin mensajes</p>
							{/if}
						</button>
					{/each}
					{#if data.conversations.length === 0}
						<p class="px-4 py-8 text-center text-gray-400 text-sm">{t(locale, 'messages.no_conversations')}</p>
					{/if}
				</div>
			</div>

			<!-- Chat area -->
			<div class="md:col-span-2 bg-white rounded-xl shadow-sm border flex flex-col min-h-[400px]">
				{#if selectedConversation}
					<div class="flex-1 p-4 overflow-y-auto">
						<p class="text-center text-gray-400 text-sm py-8">Carga los mensajes de esta conversación.<br/>La funcionalidad de chat en tiempo real está en proceso.</p>
					</div>
					<div class="border-t p-3">
						<form method="POST" action="?/sendMessage" use:enhance class="flex gap-2">
							<input type="hidden" name="conversationId" value={selectedConversation} />
							<input type="text" name="content" placeholder={t(locale, 'messages.placeholder')} required
								class="flex-1 px-3 py-2 border rounded-md text-sm" />
							<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">{t(locale, 'messages.send')}</button>
						</form>
					</div>
				{:else}
					<div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
						Seleccione una conversación
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if activeTab === 'notifications'}
		<div class="mb-3">
			<form method="POST" action="?/markAllRead" use:enhance>
				<button type="submit" class="text-sm text-primary hover:underline">{t(locale, 'messages.mark_all_read')}</button>
			</form>
		</div>
		<div class="bg-white rounded-xl shadow-sm border overflow-hidden divide-y">
			{#each data.notifications as notif}
				<div class="px-4 py-3 flex items-start gap-3 {notif.readAt ? 'opacity-60' : ''}">
					<div class="flex-1">
						<p class="text-sm font-semibold">{notif.title || notif.type || 'Notificación'}</p>
						<p class="text-xs text-gray-600 mt-0.5">{notif.message || ''}</p>
						<p class="text-xs text-gray-400 mt-0.5">{notif.createdAt ? new Date(notif.createdAt).toLocaleString('es-ES') : ''}</p>
					</div>
					{#if !notif.readAt}
						<form method="POST" action="?/markRead" use:enhance>
							<input type="hidden" name="id" value={notif.id} />
							<button type="submit" class="text-xs text-primary hover:underline">{t(locale, 'messages.mark_read')}</button>
						</form>
					{/if}
				</div>
			{/each}
			{#if data.notifications.length === 0}
				<p class="px-4 py-8 text-center text-gray-400 text-sm">No hay notificaciones.</p>
			{/if}
		</div>
	{/if}
</div>
