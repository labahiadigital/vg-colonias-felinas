<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewConversation = $state(false);
	let convoType = $state('direct');
	let activeTab = $state<'conversations' | 'notifications'>('conversations');
	let convoFilter = $state('all');
	let selectedConversation = $state<string | null>(null);
	let chatMessages = $state<Array<{ id: string; content: string; sentAt: string; senderId: string; senderName: string }>>([]);
	let loadingMessages = $state(false);

	let unreadCount = $derived(data.notifications?.filter((n: { readAt: unknown }) => !n.readAt).length || 0);

	async function selectConversation(id: string) {
		selectedConversation = id;
		loadingMessages = true;
		try {
			const res = await fetch(`/api/messages/${id}`);
			if (res.ok) chatMessages = await res.json();
		} finally {
			loadingMessages = false;
		}
	}

	async function handleSendMessage(e: SubmitEvent) {
		e.preventDefault();
		const formEl = e.target as HTMLFormElement;
		const fd = new FormData(formEl);
		const res = await fetch(formEl.action, { method: 'POST', body: fd });
		if (res.ok) {
			formEl.reset();
			if (selectedConversation) await selectConversation(selectedConversation);
		}
	}

	function typeBadge(type: string) {
		const map: Record<string, { bg: string; label: string }> = {
			colony: { bg: 'bg-primary/8 text-primary', label: t(locale, 'messages.badge_colony') },
			zone: { bg: 'bg-accent/8 text-accent', label: t(locale, 'messages.badge_zone') },
			role: { bg: 'bg-info/8 text-info', label: t(locale, 'messages.badge_role') },
			broadcast: { bg: 'bg-warning/8 text-warning', label: t(locale, 'messages.badge_broadcast') },
			direct: { bg: 'bg-surface-sunken text-text-muted', label: '' }
		};
		return map[type] ?? map['direct'];
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'messages.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">
				{data.conversations.length} {t(locale, 'messages.conversations_count')}
				{#if unreadCount > 0}
					<span class="text-warning font-medium ml-1">{unreadCount} {t(locale, 'messages.unread')}</span>
				{/if}
			</p>
		</div>
		<button onclick={() => showNewConversation = !showNewConversation}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewConversation ? t(locale, 'common.cancel') : t(locale, 'messages.new_conversation')}
		</button>
	</div>

	{#if showNewConversation}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'messages.new_conversation')}</h3>
			<form method="POST" action="?/createConversation" use:enhance class="grid gap-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="title" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'messages.title_label')}</label>
						<input type="text" name="title" id="title" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="convoType" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'messages.type_label')}</label>
						<select name="type" id="convoType" bind:value={convoType} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="direct">{t(locale, 'messages.type_direct')}</option>
							<option value="colony">{t(locale, 'messages.type_colony')}</option>
							<option value="zone">{t(locale, 'messages.type_zone')}</option>
							<option value="role">{t(locale, 'messages.type_role')}</option>
							<option value="broadcast">{t(locale, 'messages.type_broadcast')}</option>
						</select>
					</div>
				</div>

				{#if convoType === 'colony'}
					<div>
						<label for="convoColony" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'messages.colony')}</label>
						<select name="colonyId" id="convoColony" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">{t(locale, 'messages.select_colony')}</option>
							{#each data.colonies ?? [] as c}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
						<p class="text-[11px] text-text-muted mt-1">{t(locale, 'messages.colony_auto')}</p>
					</div>
				{:else if convoType === 'zone'}
					<div>
						<label for="convoZone" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'messages.zone')}</label>
						<input type="text" name="zone" id="convoZone" placeholder={t(locale, 'messages.zone_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
						<p class="text-[11px] text-text-muted mt-1">{t(locale, 'messages.zone_auto')}</p>
					</div>
				{:else if convoType === 'role'}
					<div>
						<label for="convoRole" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'messages.role_label')}</label>
						<select name="roleFilter" id="convoRole" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">{t(locale, 'messages.select_role')}</option>
							<option value="admin">{t(locale, 'messages.role_admin')}</option>
							<option value="technician">{t(locale, 'messages.role_technician')}</option>
							<option value="volunteer">{t(locale, 'messages.role_volunteer')}</option>
							<option value="vet">{t(locale, 'messages.role_vet')}</option>
						</select>
						<p class="text-[11px] text-text-muted mt-1">{t(locale, 'messages.role_auto')}</p>
					</div>
				{:else if convoType === 'direct'}
					<div>
						<label class="block text-sm font-medium text-text-secondary mb-2">{t(locale, 'messages.participants')}</label>
						<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
							{#each data.users as u}
								<label class="flex items-center gap-1.5 text-sm bg-surface-sunken px-3 py-2 rounded-lg border border-border cursor-pointer hover:border-primary/30 transition-colors min-h-[40px]">
									<input type="checkbox" name="participants" value={u.id} class="rounded border-border text-primary focus:ring-primary/20" />
									{u.name}
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<div class="pt-4 border-t border-border">
					<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
				</div>
			</form>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'messages.created')}</div>
	{/if}

	<div class="flex gap-1 p-1 bg-surface-sunken rounded-lg w-fit mb-5">
		<button onclick={() => activeTab = 'conversations'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'conversations' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'messages.conversations')}
		</button>
		<button onclick={() => activeTab = 'notifications'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 {activeTab === 'notifications' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'messages.notifications')}
			{#if unreadCount > 0}
				<span class="px-1.5 py-0.5 bg-danger text-white text-[10px] font-medium rounded-full min-w-[18px] text-center">{unreadCount}</span>
			{/if}
		</button>
	</div>

	{#if activeTab === 'conversations'}
		<div class="flex gap-1.5 mb-4 flex-wrap">
			{#each [
				{ val: 'all', key: 'messages.filter_all' },
				{ val: 'direct', key: 'messages.filter_direct' },
				{ val: 'colony', key: 'messages.filter_colony' },
				{ val: 'zone', key: 'messages.filter_zone' },
				{ val: 'role', key: 'messages.filter_role' },
				{ val: 'broadcast', key: 'messages.filter_broadcast' }
			] as f}
				<button onclick={() => convoFilter = f.val}
					class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors {convoFilter === f.val ? 'bg-primary text-white' : 'bg-surface-sunken text-text-muted hover:text-text'}">
					{t(locale, f.key)}
				</button>
			{/each}
		</div>

		<div class="grid md:grid-cols-3 gap-4">
			<div class="bg-surface rounded-xl border border-border overflow-hidden">
				<div class="divide-y divide-border">
					{#each data.conversations.filter((c: Record<string, unknown>) => convoFilter === 'all' || (c.type || 'direct') === convoFilter) as convo}
						{@const badge = typeBadge((convo.type as string) || 'direct')}
						<button onclick={() => selectConversation(convo.id)}
							class="w-full text-left px-4 py-3.5 hover:bg-surface-sunken transition-colors min-h-[60px] {selectedConversation === convo.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}">
							<div class="flex items-center gap-2">
								<p class="font-medium text-sm text-text flex-1 truncate">{convo.title || t(locale, 'messages.no_title')}</p>
								{#if badge.label}
									<span class="text-[10px] font-medium px-1.5 py-0.5 rounded {badge.bg}">{badge.label}</span>
								{/if}
							</div>
							{#if convo.lastMessage}
								<p class="text-xs text-text-muted truncate mt-0.5">{convo.lastMessage.senderName}: {convo.lastMessage.content}</p>
								<p class="text-[11px] text-text-muted mt-0.5">{convo.lastMessage.sentAt ? new Date(convo.lastMessage.sentAt).toLocaleDateString(locale) : ''}</p>
							{:else}
								<p class="text-xs text-text-muted mt-0.5">{t(locale, 'messages.no_messages')}</p>
							{/if}
						</button>
					{/each}
					{#if data.conversations.length === 0}
						<p class="px-4 py-8 text-center text-text-muted text-sm">{t(locale, 'messages.no_conversations')}</p>
					{/if}
				</div>
			</div>

			<div class="md:col-span-2 bg-surface rounded-xl border border-border flex flex-col min-h-[400px]">
				{#if selectedConversation}
					<div class="flex-1 p-4 overflow-y-auto space-y-3">
						{#if loadingMessages}
							<div class="flex items-center justify-center py-8">
								<svg class="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
							</div>
						{:else if chatMessages.length === 0}
							<p class="text-center text-text-muted text-sm py-8">{t(locale, 'messages.no_messages_yet')}</p>
						{:else}
							{#each chatMessages as msg}
								<div class="flex flex-col {msg.senderId === data.currentUserId ? 'items-end' : 'items-start'}">
									<span class="text-[11px] text-text-muted mb-0.5">{msg.senderName}</span>
									<div class="max-w-[75%] px-3 py-2 rounded-xl text-sm {msg.senderId === data.currentUserId ? 'bg-primary text-white rounded-br-sm' : 'bg-surface-sunken text-text rounded-bl-sm'}">
										{msg.content}
									</div>
									<span class="text-[10px] text-text-muted mt-0.5">{msg.sentAt ? new Date(msg.sentAt).toLocaleString(locale) : ''}</span>
								</div>
							{/each}
						{/if}
					</div>
					<div class="border-t border-border p-3">
						<form method="POST" action="?/sendMessage" onsubmit={handleSendMessage} class="flex gap-2">
							<input type="hidden" name="conversationId" value={selectedConversation} />
							<input type="text" name="content" placeholder={t(locale, 'messages.placeholder')} required
								class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
							<button type="submit" class="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors min-h-[44px]">{t(locale, 'messages.send')}</button>
						</form>
					</div>
				{:else}
					<div class="flex-1 flex items-center justify-center">
						<div class="text-center">
							<div class="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center mx-auto mb-3">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-text-muted"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
							</div>
							<p class="text-sm text-text-muted">{t(locale, 'messages.select_conversation')}</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if activeTab === 'notifications'}
		<div class="mb-3">
			<form method="POST" action="?/markAllRead" use:enhance>
				<button type="submit" class="text-sm text-primary hover:text-primary-hover font-medium transition-colors">{t(locale, 'messages.mark_all_read')}</button>
			</form>
		</div>
		<div class="bg-surface rounded-xl border border-border overflow-hidden divide-y divide-border">
			{#each data.notifications as notif}
				<div class="px-4 py-3.5 flex items-start gap-3 {notif.readAt ? 'opacity-50' : ''}">
					<div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 {notif.readAt ? 'bg-transparent' : 'bg-primary'}"></div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-text">{notif.title || notif.type || t(locale, 'messages.notification_label')}</p>
						<p class="text-xs text-text-secondary mt-0.5">{notif.message || ''}</p>
						<p class="text-[11px] text-text-muted mt-0.5">{notif.createdAt ? new Date(notif.createdAt).toLocaleString(locale) : ''}</p>
					</div>
					{#if !notif.readAt}
						<form method="POST" action="?/markRead" use:enhance>
							<input type="hidden" name="id" value={notif.id} />
							<button type="submit" class="text-xs text-primary hover:text-primary-hover font-medium transition-colors min-h-[32px]">{t(locale, 'messages.mark_read')}</button>
						</form>
					{/if}
				</div>
			{/each}
			{#if data.notifications.length === 0}
				<p class="px-4 py-12 text-center text-text-muted text-sm">{t(locale, 'messages.no_notifications')}</p>
			{/if}
		</div>
	{/if}
</div>
