<!-- Focused mobile AI vet chat: calm header, spacious conversation, single composer. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Bot from '@lucide/svelte/icons/bot';
	import History from '@lucide/svelte/icons/history';
	import ShieldPlus from '@lucide/svelte/icons/shield-plus';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import UserRound from '@lucide/svelte/icons/user-round';
	import { fieldWarning, formInput } from '$lib/form-validation';
	import type { PageProps } from './$types';

	type ChatMessage = {
		sender: 'user' | 'vet';
		text: string;
		time: string;
	};

	type VetMode = 'ai' | 'human';

	type ChatHistory = {
		id: string;
		title: string;
		updatedAt: number;
		messages: ChatMessage[];
	};

	let { data }: PageProps = $props();

	let catName = $derived(data.activeCat?.name ?? 'your cat');
	let userQuery = $state('');
	let sending = $state(false);
	let safetyOpen = $state(false);
	let historyOpen = $state(false);
	let emergencyActive = $state(false);
	let activeMode = $state<VetMode>('ai');
	let composerWarning = $state<string | undefined>(undefined);
	let chats = $state<ChatMessage[]>([]);
	let chatHistory = $state<ChatHistory[]>([]);
	let activeHistoryId = $state<string | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);

	const historyKey = 'purrward:vet-chat-history';
	const suggestions = ['Not eating today', 'Throwing up', 'Scratching a lot', 'Sneezing'];

	const emergencySigns = [
		'Trouble breathing',
		'Collapse or seizures',
		'Suspected poisoning',
		'Severe bleeding',
		"Can't urinate",
		'Extreme lethargy'
	];

	let isEmpty = $derived(chats.length === 0 && !sending);
	let canSend = $derived(userQuery.trim().length > 0 && !sending);

	// Keep newest messages in view as the conversation grows.
	$effect(() => {
		void chats.length;
		void sending;
		if (listEl) listEl.scrollTop = listEl.scrollHeight;
	});

	$effect(() => {
		const raw = localStorage.getItem(historyKey);
		if (!raw) return;

		try {
			const saved = JSON.parse(raw) as ChatHistory[];
			chatHistory = saved.filter((item) => Array.isArray(item.messages)).slice(0, 8);
		} catch {
			chatHistory = [];
		}
	});

	function addMessage(sender: 'user' | 'vet', text: string) {
		const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		chats.push({ sender, text, time });
	}

	function saveHistory(messages: ChatMessage[] = chats) {
		if (messages.length === 0) return;

		const firstUserMessage =
			messages.find((message) => message.sender === 'user')?.text ?? 'Vet chat';
		const historyItem: ChatHistory = {
			id: activeHistoryId ?? crypto.randomUUID(),
			title: firstUserMessage,
			updatedAt: Date.now(),
			messages: messages.map((message) => ({ ...message }))
		};

		activeHistoryId = historyItem.id;
		chatHistory = [historyItem, ...chatHistory.filter((item) => item.id !== historyItem.id)].slice(
			0,
			8
		);
		localStorage.setItem(historyKey, JSON.stringify(chatHistory));
	}

	function openHistory(item: ChatHistory) {
		if (sending) return;
		chats = item.messages.map((message) => ({ ...message }));
		activeMode = 'ai';
		activeHistoryId = item.id;
		historyOpen = false;
		emergencyActive = false;
	}

	function buildTriageQuestion(question: string): string {
		let previousUserMessage: string | null = null;
		for (let index = chats.length - 1; index >= 0; index -= 1) {
			if (chats[index].sender !== 'user') continue;
			previousUserMessage = chats[index].text;
			break;
		}
		if (!previousUserMessage || previousUserMessage === question) return question;
		return `Previous concern: ${previousUserMessage}. Follow-up: ${question}`;
	}

	type ParsedReply = { intro: string | null; points: string[] };

	function stripBullet(line: string): string {
		return line.replace(/^- /, '');
	}

	// Splits a vet reply into an optional friendly intro sentence plus scannable bullet points.
	function parseReply(text: string): ParsedReply {
		const lines = text
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
		const bulletLines = lines.filter((line) => line.startsWith('- '));
		if (bulletLines.length === 0) return { intro: null, points: [] };

		const intro = lines.find((line) => !line.startsWith('- ')) ?? null;
		return { intro, points: bulletLines.map(stripBullet) };
	}

	async function sendQuestion(question: string) {
		if (sending) return;
		const cleanQuestion = question.trim();
		if (!cleanQuestion) return;

		const triageQuestion = buildTriageQuestion(cleanQuestion);
		addMessage('user', cleanQuestion);
		sending = true;

		try {
			const formData = new FormData();
			formData.set('question', triageQuestion);
			const response = await fetch('/api/vet/triage', { method: 'POST', body: formData });
			const body = (await response.json()) as {
				reply?: string;
				emergency?: boolean;
				error?: string;
			};
			addMessage('vet', body.reply ?? body.error ?? 'Vet triage is unavailable right now.');
			// SECURITY/UX: server-detected emergencies surface the banner automatically.
			if (body.emergency) {
				emergencyActive = true;
				safetyOpen = true;
			}
		} catch {
			addMessage('vet', 'Vet triage is unavailable right now.');
		} finally {
			sending = false;
			saveHistory();
		}
	}

	async function handleSend(event: Event) {
		event.preventDefault();
		const form = event.currentTarget;
		if (form instanceof HTMLFormElement) {
			const input = formInput(form, 'question');
			composerWarning = input ? fieldWarning(input, 'Question') : undefined;
			if (composerWarning) return;
		}

		const query = userQuery.trim();
		if (!query) {
			composerWarning = 'Question is required.';
			return;
		}

		composerWarning = undefined;
		userQuery = '';
		await sendQuestion(query);
	}

	async function selectSuggestion(prompt: string) {
		await sendQuestion(`My cat is ${prompt.toLowerCase()}.`);
	}

	function resetChat() {
		if (sending) return;
		saveHistory();
		chats = [];
		userQuery = '';
		emergencyActive = false;
		activeHistoryId = null;
	}
</script>

<svelte:head>
	<title>Purrward | Vet Chat</title>
</svelte:head>

<div class="vet-page">
	<header class="vet-header">
		<div class="title-block">
			<h1>Ask about {catName}</h1>
			<p>{activeMode === 'ai' ? 'AI triage only' : 'In-person vet help'}</p>
		</div>
		<div class="header-actions">
			<div class="history-wrap">
				<button
					class="header-button"
					class:active={historyOpen}
					type="button"
					aria-expanded={historyOpen}
					aria-label="Chat history"
					onclick={() => (historyOpen = !historyOpen)}
				>
					<History size={18} strokeWidth={2.2} aria-hidden="true" />
				</button>
			</div>
			<button
				class="header-button"
				class:active={safetyOpen}
				type="button"
				aria-expanded={safetyOpen}
				aria-label="Emergency signs"
				onclick={() => (safetyOpen = !safetyOpen)}
			>
				<ShieldPlus size={19} strokeWidth={2.2} aria-hidden="true" />
			</button>
			<button
				class="header-button"
				type="button"
				aria-label="Start a new chat"
				disabled={isEmpty}
				onclick={resetChat}
			>
				<SquarePen size={18} strokeWidth={2.2} aria-hidden="true" />
			</button>
		</div>
	</header>

	{#if historyOpen}
		<div class="history-menu" aria-label="Recent chat history">
			<p>Recent AI chats</p>
			{#if chatHistory.length === 0}
				<span>No saved chats yet</span>
			{:else}
				{#each chatHistory as item (item.id)}
					<button type="button" onclick={() => openHistory(item)}>
						<strong>{item.title}</strong>
						<small>{new Date(item.updatedAt).toLocaleDateString()}</small>
					</button>
				{/each}
			{/if}
		</div>
	{/if}

	<div class="mode-switch" aria-label="Vet help mode">
		<button
			class:active={activeMode === 'ai'}
			type="button"
			aria-pressed={activeMode === 'ai'}
			onclick={() => {
				activeMode = 'ai';
				historyOpen = false;
			}}
		>
			<Bot size={17} strokeWidth={2.2} aria-hidden="true" />
			<span>Talk to AI</span>
		</button>
		<button
			class:active={activeMode === 'human'}
			type="button"
			aria-pressed={activeMode === 'human'}
			onclick={() => {
				activeMode = 'human';
				historyOpen = false;
			}}
		>
			<UserRound size={17} strokeWidth={2.2} aria-hidden="true" />
			<span>Vet visit help</span>
		</button>
	</div>

	{#if emergencyActive}
		<aside class="emergency-banner" role="alert">
			<AlertTriangle size={18} strokeWidth={2.4} aria-hidden="true" />
			<p>This may be an emergency. Contact a vet or emergency clinic now.</p>
		</aside>
	{/if}

	{#if safetyOpen}
		<aside class="safety-panel" aria-label="When to seek emergency care">
			<div class="safety-head">
				<AlertTriangle size={16} strokeWidth={2.3} aria-hidden="true" />
				<p>Emergency vet if:</p>
			</div>
			<ul>
				{#each emergencySigns as sign (sign)}
					<li>{sign}</li>
				{/each}
			</ul>
		</aside>
	{/if}

	<div class="conversation" bind:this={listEl} aria-live="polite">
		{#if activeMode === 'human'}
			<div class="human-panel">
				<div class="human-mark" aria-hidden="true">
					<UserRound size={28} strokeWidth={1.9} />
				</div>
				<h2>See a licensed vet</h2>
				<p>
					AI triage is not a diagnosis. For care decisions, urgent symptoms, or treatment plans,
					book an in-person vet. Redeem Purrpoints toward a vet visit discount.
				</p>
				<a class="human-link" href={resolve('/rewards')}>Redeem vet visit help</a>
			</div>
		{:else if isEmpty}
			<div class="onboarding">
				<div class="onboarding-mark" aria-hidden="true">
					<Stethoscope size={28} strokeWidth={1.9} />
				</div>
				<h2>What is up with {catName}?</h2>
				<p>Tell me symptoms or behavior.</p>
			</div>
		{:else}
			<div class="message-list">
				{#each chats as chat, i (i)}
					<div class={['message-row', chat.sender]}>
						{#if chat.sender === 'vet'}
							<div class="message-avatar" aria-hidden="true">
								<Stethoscope size={14} strokeWidth={2.2} />
							</div>
						{/if}
						<div class="message-bubble">
							{#if chat.sender === 'vet' && parseReply(chat.text).points.length > 0}
								{@const parsed = parseReply(chat.text)}
								{#if parsed.intro}
									<p class="message-intro">{parsed.intro}</p>
								{/if}
								<ul class="message-points">
									{#each parsed.points as point, pointIndex (pointIndex)}
										<li>{point}</li>
									{/each}
								</ul>
							{:else}
								<p>{chat.text}</p>
							{/if}
							<small>{chat.time}</small>
						</div>
					</div>
				{/each}
				{#if sending}
					<div class="message-row vet">
						<div class="message-avatar" aria-hidden="true">
							<Stethoscope size={14} strokeWidth={2.2} />
						</div>
						<div class="message-bubble typing">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if activeMode === 'ai'}
		<div class="dock">
			{#if isEmpty}
				<div class="suggestions" aria-label="Suggested questions">
					{#each suggestions as prompt (prompt)}
						<button type="button" onclick={() => selectSuggestion(prompt)}>{prompt}</button>
					{/each}
				</div>
			{/if}

			<form class="composer" novalidate onsubmit={handleSend}>
				<input
					name="question"
					type="text"
					placeholder="Ask about {catName}…"
					bind:value={userQuery}
					aria-invalid={Boolean(composerWarning)}
					oninput={() => (composerWarning = undefined)}
					required
				/>
				<button
					class="send-button"
					class:ready={canSend}
					type="submit"
					aria-label="Send message"
					disabled={!canSend}
				>
					<ArrowUp size={18} strokeWidth={2.6} aria-hidden="true" />
				</button>
			</form>
			{#if composerWarning}
				<p class="composer-warning" aria-live="polite">{composerWarning}</p>
			{/if}

			<p class="disclaimer">Triage only. Call a vet for care.</p>
		</div>
	{:else}
		<p class="disclaimer human-disclaimer">For emergencies, contact a nearby clinic now.</p>
	{/if}
</div>

<style>
	.vet-page {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-height: calc(100dvh - 174px);
	}

	/* Calm header */
	.vet-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding-top: 4px;
	}

	.title-block h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.5rem;
		line-height: 1.05;
	}

	.title-block p {
		overflow: hidden;
		margin: 4px 0 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-actions {
		display: flex;
		flex: 0 0 auto;
		gap: 8px;
	}

	.history-wrap {
		display: contents;
	}

	.header-button {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		cursor: pointer;
		box-shadow: 0 8px 20px rgba(36, 38, 38, 0.05);
		transition:
			background 140ms ease,
			color 140ms ease,
			opacity 140ms ease;
	}

	.header-button.active {
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		border-color: rgba(156, 51, 41, 0.18);
	}

	.history-wrap .header-button.active {
		background: var(--color-info-bg);
		color: var(--color-info-text);
		border-color: color-mix(in srgb, var(--color-info-text) 20%, transparent);
	}

	.header-button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.history-menu {
		display: grid;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-2);
		padding: 10px;
		box-shadow: var(--shadow-float);
	}

	.history-menu p,
	.history-menu span {
		margin: 0;
		padding: 3px 5px;
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 800;
	}

	.history-menu button {
		display: grid;
		gap: 3px;
		width: 100%;
		border: 0;
		border-radius: 16px;
		background: transparent;
		color: var(--color-ink);
		padding: 9px 10px;
		text-align: left;
		cursor: pointer;
	}

	.history-menu button:hover {
		background: var(--color-paper-3);
	}

	.history-menu strong {
		overflow: hidden;
		font-size: 0.82rem;
		font-weight: 800;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history-menu small {
		color: var(--color-muted);
		font-size: 0.7rem;
		font-weight: 700;
	}

	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 24px;
		background: var(--color-paper-3);
		padding: 5px;
	}

	.mode-switch button {
		display: flex;
		min-width: 0;
		align-items: center;
		justify-content: center;
		gap: 7px;
		border: 0;
		border-radius: 19px;
		background: transparent;
		color: var(--color-muted);
		padding: 10px 8px;
		font-size: 0.82rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease,
			box-shadow 140ms ease;
	}

	.mode-switch button.active {
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 8px 18px rgba(36, 38, 38, 0.06);
	}

	.mode-switch span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Auto emergency banner shown when the server flags urgent symptoms */
	.emergency-banner {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid color-mix(in srgb, var(--color-danger-text) 30%, transparent);
		border-radius: 18px;
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		padding: 12px 14px;
	}

	.emergency-banner p {
		margin: 0;
		font-size: 0.86rem;
		font-weight: 800;
		line-height: 1.3;
	}

	/* Lightweight, collapsible safety guidance */
	.safety-panel {
		border: 1px solid rgba(156, 51, 41, 0.16);
		border-radius: 20px;
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		padding: 13px 15px;
	}

	.safety-head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.safety-head p {
		overflow: hidden;
		margin: 0;
		font-size: 0.8rem;
		font-weight: 750;
		line-height: 1.3;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.safety-panel ul {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 11px 0 0;
		padding: 0;
		list-style: none;
	}

	.safety-panel li {
		border-radius: var(--radius-pill);
		background: rgba(255, 253, 248, 0.6);
		padding: 5px 11px;
		font-size: 0.74rem;
		font-weight: 700;
	}

	/* Spacious conversation area */
	.conversation {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	.onboarding {
		display: grid;
		justify-items: center;
		gap: 10px;
		height: 100%;
		min-height: 320px;
		align-content: center;
		padding: 0 24px;
		text-align: center;
	}

	.onboarding-mark {
		display: grid;
		width: 64px;
		height: 64px;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.07);
		border-radius: 24px;
		background:
			radial-gradient(circle at 34% 24%, rgba(136, 206, 223, 0.34), transparent 48%),
			radial-gradient(circle at 76% 80%, rgba(244, 191, 168, 0.32), transparent 46%),
			var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 14px 32px rgba(36, 38, 38, 0.08);
	}

	.onboarding h2 {
		margin: 6px 0 0;
		color: var(--color-ink);
		font-size: 1.34rem;
		line-height: 1.1;
	}

	.onboarding p {
		overflow: hidden;
		max-width: 280px;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		line-height: 1.45;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.human-panel {
		display: grid;
		justify-items: center;
		gap: 12px;
		height: 100%;
		min-height: 320px;
		align-content: center;
		padding: 0 24px;
		text-align: center;
	}

	.human-mark {
		display: grid;
		width: 64px;
		height: 64px;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.07);
		border-radius: 24px;
		background:
			radial-gradient(circle at 34% 24%, rgba(169, 200, 168, 0.34), transparent 48%),
			radial-gradient(circle at 76% 80%, rgba(244, 191, 168, 0.32), transparent 46%),
			var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 14px 32px rgba(36, 38, 38, 0.08);
	}

	.human-panel h2 {
		margin: 6px 0 0;
		color: var(--color-ink);
		font-size: 1.34rem;
		line-height: 1.1;
	}

	.human-panel p {
		max-width: 290px;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		line-height: 1.45;
	}

	.human-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 12px 18px;
		font-size: 0.86rem;
		font-weight: 800;
		text-decoration: none;
	}

	.message-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 4px 2px 8px;
	}

	.message-row {
		display: flex;
		gap: 8px;
		align-items: flex-end;
	}

	.message-row.user {
		justify-content: flex-end;
	}

	.message-avatar {
		display: grid;
		width: 28px;
		height: 28px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.07);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-muted);
		box-shadow: 0 6px 14px rgba(36, 38, 38, 0.05);
	}

	.message-bubble {
		max-width: min(80%, 320px);
		border-radius: 22px;
		padding: 12px 15px 9px;
	}

	.message-row.vet .message-bubble {
		max-width: min(86%, 340px);
		border: 1px solid rgba(36, 38, 38, 0.07);
		border-bottom-left-radius: 8px;
		background: var(--color-paper-2);
		color: var(--color-ink);
		box-shadow: 0 8px 20px rgba(36, 38, 38, 0.05);
	}

	.message-row.user .message-bubble {
		border-bottom-right-radius: 8px;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
	}

	.message-bubble p {
		margin: 0;
		overflow-wrap: break-word;
		font-size: 0.86rem;
		font-weight: 500;
		hyphens: none;
		line-height: 1.42;
		white-space: pre-line;
	}

	.message-intro {
		margin: 0 0 9px;
		overflow-wrap: break-word;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 700;
		line-height: 1.4;
	}

	.message-points {
		display: grid;
		gap: 7px;
		margin: 0;
		padding-left: 0;
		overflow-wrap: break-word;
		font-size: 0.86rem;
		font-weight: 500;
		hyphens: none;
		line-height: 1.38;
		list-style: none;
	}

	.message-points li {
		position: relative;
		padding-left: 14px;
	}

	.message-points li::before {
		position: absolute;
		top: 0.58em;
		left: 0;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--color-muted);
		content: '';
		opacity: 0.7;
	}

	.message-bubble small {
		display: block;
		margin-top: 5px;
		font-size: 0.62rem;
		font-weight: 700;
		opacity: 0.5;
		text-align: right;
	}

	.message-bubble.typing {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-width: 52px;
		padding: 14px 15px;
	}

	.message-bubble.typing span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-muted);
		opacity: 0.4;
		animation: typing 1.1s infinite ease-in-out;
	}

	.message-bubble.typing span:nth-child(2) {
		animation-delay: 0.18s;
	}

	.message-bubble.typing span:nth-child(3) {
		animation-delay: 0.36s;
	}

	@keyframes typing {
		0%,
		60%,
		100% {
			opacity: 0.32;
			transform: translateY(0);
		}
		30% {
			opacity: 0.8;
			transform: translateY(-3px);
		}
	}

	/* Composer dock — the main action */
	.dock {
		display: grid;
		gap: 10px;
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.suggestions button {
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		padding: 8px 14px;
		font-size: 0.8rem;
		font-weight: 750;
		cursor: pointer;
		box-shadow: 0 6px 16px rgba(36, 38, 38, 0.04);
		transition: transform 120ms ease;
	}

	.suggestions button:hover {
		transform: translateY(-1px);
	}

	.composer {
		display: grid;
		grid-template-columns: 1fr 40px;
		gap: 8px;
		align-items: center;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 26px;
		background: var(--color-paper-2);
		padding: 8px 8px 8px 14px;
		box-shadow: 0 14px 34px rgba(36, 38, 38, 0.1);
	}

	.composer input {
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.2;
		outline: none;
	}

	.composer input::placeholder {
		color: var(--color-muted);
		opacity: 0.8;
	}

	.composer-warning {
		margin: -2px 8px 0;
		border-radius: 16px;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
		padding: 9px 12px;
		font-size: 0.78rem;
		font-weight: 750;
		line-height: 1.34;
	}

	.send-button {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		cursor: pointer;
		background: rgba(36, 38, 38, 0.18);
		color: var(--color-paper-2);
		transition:
			background 140ms ease,
			transform 140ms ease;
	}

	.send-button.ready {
		background: var(--color-charcoal);
	}

	.send-button:disabled {
		cursor: default;
	}

	.disclaimer {
		overflow: hidden;
		margin: 0;
		padding: 0 8px 2px;
		color: var(--color-muted);
		font-size: 0.68rem;
		font-weight: 600;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.85;
	}

	.human-disclaimer {
		padding-bottom: 3px;
	}

	@media (max-width: 390px) {
		.title-block h1 {
			font-size: 1.38rem;
		}

		.message-bubble {
			max-width: 84%;
		}
	}
</style>
