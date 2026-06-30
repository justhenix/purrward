<!-- Focused mobile AI vet chat: calm header, spacious conversation, single composer. -->
<script lang="ts">
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import ShieldPlus from '@lucide/svelte/icons/shield-plus';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';

	type ChatMessage = {
		sender: 'user' | 'vet';
		text: string;
		time: string;
	};

	let userQuery = $state('');
	let sending = $state(false);
	let safetyOpen = $state(false);
	let chats = $state<ChatMessage[]>([]);
	let listEl = $state<HTMLDivElement | null>(null);

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

	function addMessage(sender: 'user' | 'vet', text: string) {
		const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		chats.push({ sender, text, time });
	}

	async function sendQuestion(question: string) {
		if (sending) return;
		const cleanQuestion = question.trim();
		if (!cleanQuestion) return;

		addMessage('user', cleanQuestion);
		sending = true;

		try {
			const formData = new FormData();
			formData.set('question', cleanQuestion);
			const response = await fetch('/api/vet/triage', { method: 'POST', body: formData });
			const body = (await response.json()) as { reply?: string; error?: string };
			addMessage('vet', body.reply ?? body.error ?? 'Vet triage is unavailable right now.');
		} catch {
			addMessage('vet', 'Vet triage is unavailable right now.');
		} finally {
			sending = false;
		}
	}

	async function handleSend(event: Event) {
		event.preventDefault();
		const query = userQuery.trim();
		if (!query) return;

		userQuery = '';
		await sendQuestion(query);
	}

	async function selectSuggestion(prompt: string) {
		await sendQuestion(`My cat is ${prompt.toLowerCase()}.`);
	}

	function resetChat() {
		if (sending) return;
		chats = [];
		userQuery = '';
	}
</script>

<svelte:head>
	<title>Purrward | Vet Chat</title>
</svelte:head>

<div class="vet-page">
	<header class="vet-header">
		<div class="title-block">
			<h1>Ask about Mochi</h1>
			<p>AI vet triage · not a diagnosis</p>
		</div>
		<div class="header-actions">
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

	{#if safetyOpen}
		<aside class="safety-panel" aria-label="When to seek emergency care">
			<div class="safety-head">
				<AlertTriangle size={16} strokeWidth={2.3} aria-hidden="true" />
				<p>Go straight to an emergency vet for any of these:</p>
			</div>
			<ul>
				{#each emergencySigns as sign (sign)}
					<li>{sign}</li>
				{/each}
			</ul>
		</aside>
	{/if}

	<div class="conversation" bind:this={listEl} aria-live="polite">
		{#if isEmpty}
			<div class="onboarding">
				<div class="onboarding-mark" aria-hidden="true">
					<Stethoscope size={28} strokeWidth={1.9} />
				</div>
				<h2>How can I help with Mochi?</h2>
				<p>
					Describe symptoms or behavior changes. I'll help you sort what to watch and when to see a
					vet.
				</p>
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
							<p>{chat.text}</p>
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

	<div class="dock">
		{#if isEmpty}
			<div class="suggestions" aria-label="Suggested questions">
				{#each suggestions as prompt (prompt)}
					<button type="button" onclick={() => selectSuggestion(prompt)}>{prompt}</button>
				{/each}
			</div>
		{/if}

		<form class="composer" onsubmit={handleSend}>
			<button class="composer-tool" type="button" aria-label="Attach a photo">
				<Paperclip size={19} strokeWidth={2.1} aria-hidden="true" />
			</button>
			<input type="text" placeholder="Ask about Mochi…" bind:value={userQuery} required />
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

		<p class="disclaimer">Triage guidance only — not a substitute for a veterinarian.</p>
	</div>
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
		margin: 4px 0 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 650;
	}

	.header-actions {
		display: flex;
		flex: 0 0 auto;
		gap: 8px;
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

	.header-button:disabled {
		opacity: 0.4;
		cursor: default;
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
		margin: 0;
		font-size: 0.8rem;
		font-weight: 750;
		line-height: 1.3;
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
		max-width: 280px;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		line-height: 1.45;
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
		padding: 11px 14px 8px;
	}

	.message-row.vet .message-bubble {
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
		font-size: 0.88rem;
		font-weight: 520;
		line-height: 1.45;
		white-space: pre-wrap;
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
		grid-template-columns: 40px 1fr 40px;
		gap: 8px;
		align-items: center;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 26px;
		background: var(--color-paper-2);
		padding: 8px;
		box-shadow: 0 14px 34px rgba(36, 38, 38, 0.1);
	}

	.composer input {
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font-size: 0.95rem;
		font-weight: 600;
		outline: none;
	}

	.composer input::placeholder {
		color: var(--color-muted);
		opacity: 0.8;
	}

	.composer-tool,
	.send-button {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		cursor: pointer;
	}

	.composer-tool {
		background: var(--color-paper-3);
		color: var(--color-charcoal);
	}

	.send-button {
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
		margin: 0;
		padding: 0 6px;
		color: var(--color-muted);
		font-size: 0.68rem;
		font-weight: 600;
		text-align: center;
		opacity: 0.85;
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
