<script lang="ts">
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Plus from '@lucide/svelte/icons/plus';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';

	type ChatMessage = {
		sender: 'user' | 'vet';
		text: string;
		time: string;
	};

	let userQuery = $state('');
	let sending = $state(false);
	let chats = $state<ChatMessage[]>([
		{
			sender: 'vet',
			text: 'Tell me what changed with your cat. I can help you sort symptoms, home monitoring steps, and when to call a vet.',
			time: '10:00 AM'
		}
	]);

	const symptoms = ['Appetite loss', 'Vomiting', 'Scratching', 'Sneezing', 'Sleeping more'];

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

	async function selectSymptom(symptom: string) {
		await sendQuestion(`My cat has ${symptom.toLowerCase()}.`);
	}
</script>

<!-- Vet chat screen for calm symptom triage guidance. -->

<svelte:head>
	<title>Purrward | Vet Chat</title>
</svelte:head>

<div class="vet-chat-page">
	<header class="vet-topbar">
		<div class="assistant-mark" aria-hidden="true">
			<Stethoscope size={21} strokeWidth={2.1} />
		</div>
		<div>
			<p>Vet care chat</p>
			<h1>Ask about Mochi</h1>
		</div>
	</header>

	<section class="emergency-strip" aria-labelledby="emergency-title">
		<AlertTriangle size={19} strokeWidth={2.2} aria-hidden="true" />
		<div>
			<h2 id="emergency-title">
				Go straight to emergency care for breathing trouble, collapse, poisoning, severe bleeding,
				or blocked urination.
			</h2>
		</div>
	</section>

	<section class="chat-shell" aria-label="Vet care conversation">
		<div class="welcome-panel">
			<div class="assistant-mark large" aria-hidden="true">
				<Stethoscope size={30} strokeWidth={1.9} />
			</div>
			<h2>How can I help with Mochi today?</h2>
			<p>Describe symptoms, behavior changes, food, water, litter, or medication concerns.</p>
		</div>

		<div class="message-list" aria-live="polite">
			{#each chats as chat, i (i)}
				<div class={['message-row', chat.sender]}>
					{#if chat.sender === 'vet'}
						<div class="message-avatar" aria-hidden="true">
							<Stethoscope size={15} strokeWidth={2.2} />
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
						<Stethoscope size={15} strokeWidth={2.2} />
					</div>
					<div class="message-bubble typing">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			{/if}
		</div>

		<div class="symptom-row" aria-label="Common symptom prompts">
			{#each symptoms as symptom (symptom)}
				<button class="symptom-chip" disabled={sending} onclick={() => selectSymptom(symptom)}>
					{symptom}
				</button>
			{/each}
		</div>

		<form class="composer" onsubmit={handleSend}>
			<button class="composer-tool" type="button" aria-label="Add context">
				<Plus size={21} strokeWidth={2.2} aria-hidden="true" />
			</button>
			<input
				type="text"
				placeholder="Ask about vomiting, scratching, behavior..."
				bind:value={userQuery}
				required
			/>
			<button class="send-button" type="submit" aria-label="Send message" disabled={sending}>
				<ArrowUp size={19} strokeWidth={2.4} aria-hidden="true" />
			</button>
		</form>
	</section>

	<p class="disclaimer">
		Vet chat gives triage guidance only. It does not replace professional diagnosis, treatment, or
		hands-on veterinary care.
	</p>
</div>

<style>
	.vet-chat-page {
		display: grid;
		gap: 14px;
		min-height: calc(100dvh - 174px);
	}

	.vet-topbar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 4px;
	}

	.assistant-mark {
		display: grid;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 18px;
		background:
			radial-gradient(circle at 30% 22%, rgba(136, 206, 223, 0.3), transparent 45%),
			var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 12px 28px rgba(36, 38, 38, 0.07);
	}

	.assistant-mark.large {
		width: 66px;
		height: 66px;
		margin: 0 auto;
		border-radius: 24px;
		background:
			radial-gradient(circle at 36% 22%, rgba(244, 191, 168, 0.38), transparent 46%),
			radial-gradient(circle at 78% 78%, rgba(169, 200, 168, 0.28), transparent 42%),
			var(--color-paper-2);
	}

	.vet-topbar p {
		margin: 0 0 3px;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.vet-topbar h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.48rem;
		line-height: 1.05;
	}

	.emergency-strip {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		border: 1px solid rgba(156, 51, 41, 0.16);
		border-radius: 22px;
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		padding: 12px 14px;
	}

	.emergency-strip h2 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 750;
		line-height: 1.32;
	}

	.chat-shell {
		display: grid;
		grid-template-rows: auto minmax(250px, 1fr) auto auto;
		min-height: 590px;
		overflow: hidden;
		border: 1px solid rgba(232, 222, 203, 0.82);
		border-radius: 34px;
		background:
			radial-gradient(circle at 12% 0%, rgba(196, 237, 243, 0.32), transparent 34%),
			radial-gradient(circle at 95% 16%, rgba(248, 207, 187, 0.27), transparent 32%),
			linear-gradient(180deg, #fffdf8 0%, #fdf8ef 100%);
		box-shadow: var(--shadow-card);
	}

	.welcome-panel {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 26px 24px 14px;
		text-align: center;
	}

	.welcome-panel h2 {
		max-width: 270px;
		margin: 4px 0 0;
		color: var(--color-ink);
		font-size: 1.36rem;
		line-height: 1.08;
	}

	.welcome-panel p {
		max-width: 300px;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.83rem;
		font-weight: 650;
		line-height: 1.38;
	}

	.message-list {
		display: flex;
		min-height: 0;
		flex-direction: column;
		gap: 11px;
		overflow-y: auto;
		padding: 8px 14px 14px;
		scrollbar-width: thin;
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
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-muted);
		box-shadow: 0 6px 14px rgba(36, 38, 38, 0.05);
	}

	.message-bubble {
		max-width: min(78%, 310px);
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 22px;
		padding: 11px 13px 8px;
		box-shadow: 0 8px 22px rgba(36, 38, 38, 0.055);
	}

	.message-row.vet .message-bubble {
		border-bottom-left-radius: 8px;
		background: rgba(255, 253, 248, 0.94);
		color: var(--color-ink);
	}

	.message-row.user .message-bubble {
		border-bottom-right-radius: 8px;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
	}

	.message-bubble p {
		margin: 0;
		font-size: 0.86rem;
		font-weight: 560;
		line-height: 1.42;
		white-space: pre-wrap;
	}

	.message-bubble small {
		display: block;
		margin-top: 5px;
		font-size: 0.62rem;
		font-weight: 700;
		opacity: 0.54;
		text-align: right;
	}

	.message-bubble.typing {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-width: 54px;
		padding: 14px 15px;
	}

	.message-bubble.typing span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-muted);
		opacity: 0.42;
	}

	.symptom-row {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 0 14px 10px;
		scrollbar-width: none;
	}

	.symptom-row::-webkit-scrollbar {
		display: none;
	}

	.symptom-chip {
		flex: 0 0 auto;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: var(--radius-pill);
		background: rgba(255, 253, 248, 0.78);
		color: var(--color-charcoal);
		padding: 8px 12px;
		font-size: 0.78rem;
		font-weight: 800;
		cursor: pointer;
	}

	.symptom-chip:disabled {
		opacity: 0.58;
		cursor: progress;
	}

	.composer {
		display: grid;
		grid-template-columns: 40px 1fr 40px;
		gap: 8px;
		align-items: center;
		margin: 0 12px 12px;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 28px;
		background: var(--color-paper-2);
		padding: 7px;
		box-shadow: 0 14px 34px rgba(36, 38, 38, 0.1);
	}

	.composer input {
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 650;
		outline: none;
	}

	.composer input::placeholder {
		color: var(--color-muted);
		opacity: 0.82;
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
		background: var(--color-charcoal);
		color: var(--color-paper-2);
	}

	.send-button:disabled {
		opacity: 0.58;
		cursor: progress;
	}

	.disclaimer {
		margin: 0;
		padding: 0 8px;
		color: var(--color-muted);
		font-size: 0.68rem;
		font-weight: 600;
		line-height: 1.42;
	}

	@media (max-width: 390px) {
		.chat-shell {
			min-height: 560px;
			border-radius: 30px;
		}

		.welcome-panel {
			padding-top: 22px;
		}

		.message-bubble {
			max-width: 82%;
		}
	}
</style>
