<script lang="ts">
	type ChatMessage = {
		sender: 'user' | 'vet';
		text: string;
		time: string;
	};

	let userQuery = $state('');
	let chats = $state<ChatMessage[]>([
		{
			sender: 'vet',
			text: "Hello! I am your AI care assistant. Describe your cat's symptoms (e.g. vomiting, lethargy, or loss of appetite) for quick, supportive triage guidance.",
			time: '10:00 AM'
		}
	]);

	const symptoms = ['Appetite Loss', 'Vomiting', 'Scratching', 'Sneezing', 'Sleeping More'];

	function addMessage(sender: 'user' | 'vet', text: string) {
		const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		chats.push({ sender, text, time });
	}

	function handleSend(event: Event) {
		event.preventDefault();
		if (!userQuery.trim()) return;

		const query = userQuery;
		addMessage('user', query);
		userQuery = '';

		setTimeout(() => {
			addMessage(
				'vet',
				'Checking symptoms... Remember, I am an AI helper. If your cat shows severe lethargy, blood, or difficulty breathing, visit a vet clinic immediately.'
			);
		}, 800);
	}

	function selectSymptom(symptom: string) {
		addMessage('user', `My cat has ${symptom.toLowerCase()}`);
		setTimeout(() => {
			addMessage(
				'vet',
				`Understood. Please monitor for any other symptoms like diarrhea, changes in bathroom habits, or changes in activity. Let me know if you see these.`
			);
		}, 800);
	}
</script>

<!-- Vet chat screen for symptom triage guidance. -->

<svelte:head>
	<title>Purrward AI Vet Triage</title>
</svelte:head>

<div class="vet-chat-page">
	<!-- Emergency Warning Banner -->
	<section class="emergency-banner card">
		<div class="emergency-icon">🚨</div>
		<div class="emergency-body">
			<h4>Emergency Vet Warning</h4>
			<p>
				If your cat has difficulty breathing, severe bleeding, or poisoning, bypass triage and seek
				emergency veterinary care immediately.
			</p>
		</div>
	</section>

	<section class="chat-container card">
		<div class="chat-header">
			<div class="vet-profile">
				<span class="vet-avatar">🩺</span>
				<div>
					<h4>AI Vet Assistant</h4>
					<span class="status">Online Triage</span>
				</div>
			</div>
		</div>

		<div class="chat-messages-area">
			{#each chats as chat, i (i)}
				<div class="message-bubble {chat.sender}">
					<div class="bubble-content">
						<p>{chat.text}</p>
						<small class="time">{chat.time}</small>
					</div>
				</div>
			{/each}
		</div>

		<!-- Quick Symptom Chips -->
		<div class="symptom-chips-container">
			<span class="chips-label">Quick Symptoms:</span>
			<div class="chips-row">
				{#each symptoms as symptom (symptom)}
					<button class="chip" onclick={() => selectSymptom(symptom)}>{symptom}</button>
				{/each}
			</div>
		</div>

		<!-- Chat Input Form -->
		<form class="chat-input-form" onsubmit={handleSend}>
			<input
				type="text"
				placeholder="Ask about vomiting, scratching, behavior..."
				bind:value={userQuery}
				required
			/>
			<button type="submit" class="send-btn" aria-label="Send message">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="22" y1="2" x2="11" y2="13" />
					<polygon points="22 2 15 22 11 13 2 9 22 2" />
				</svg>
			</button>
		</form>
	</section>

	<div class="disclaimer-text">
		<p>
			⚠️ Disclaimer: AI triage is for informative guidance only and does not replace professional
			diagnosis, treatment, or hands-on clinical veterinary consults.
		</p>
	</div>
</div>

<style>
	.vet-chat-page {
		display: grid;
		gap: 16px;
	}

	.card {
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-card);
		position: relative;
		overflow: hidden;
	}

	.emergency-banner {
		display: flex;
		gap: 12px;
		padding: 16px;
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		border: 1px solid var(--color-rose);
	}

	.emergency-icon {
		font-size: 1.3rem;
		line-height: 1;
	}

	.emergency-body h4 {
		margin: 0 0 2px;
		font-size: 0.88rem;
		font-weight: 700;
	}

	.emergency-body p {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		height: 480px;
		background: var(--color-paper-2);
	}

	.chat-header {
		padding: 14px 18px;
		border-bottom: 1px solid var(--color-line);
		background: var(--color-paper-2);
	}

	.vet-profile {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.vet-avatar {
		width: 32px;
		height: 32px;
		background: var(--color-sky-soft);
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 1.1rem;
	}

	.vet-profile h4 {
		margin: 0;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--color-ink);
	}

	.vet-profile .status {
		font-size: 0.68rem;
		color: var(--color-success-text);
		font-weight: 600;
	}

	.chat-messages-area {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: var(--color-paper);
	}

	.message-bubble {
		display: flex;
		max-width: 80%;
	}

	.message-bubble.vet {
		align-self: flex-start;
	}

	.message-bubble.user {
		align-self: flex-end;
	}

	.bubble-content {
		padding: 10px 14px;
		border-radius: 20px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
		position: relative;
	}

	.message-bubble.vet .bubble-content {
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		color: var(--color-ink);
		border-top-left-radius: 4px;
	}

	.message-bubble.user .bubble-content {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		border-top-right-radius: 4px;
	}

	.bubble-content p {
		margin: 0 0 4px;
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.bubble-content .time {
		font-size: 0.58rem;
		opacity: 0.6;
		display: block;
		text-align: right;
	}

	.symptom-chips-container {
		padding: 10px 16px;
		background: var(--color-paper-2);
		border-top: 1px solid var(--color-line);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.chips-label {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.chips-row {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 2px;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.chips-row::-webkit-scrollbar {
		display: none;
	}

	.chip {
		background: var(--color-paper-3);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		padding: 5px 12px;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-ink);
		cursor: pointer;
		white-space: nowrap;
	}

	.chip:active {
		background: var(--color-line);
	}

	.chat-input-form {
		display: flex;
		padding: 10px;
		background: var(--color-paper-2);
		border-top: 1px solid var(--color-line);
		gap: 8px;
	}

	.chat-input-form input {
		flex: 1;
		border: 1px solid var(--color-line);
		background: var(--color-paper);
		border-radius: var(--radius-pill);
		padding: 8px 16px;
		font-size: 0.85rem;
		outline: none;
	}

	.chat-input-form input:focus {
		border-color: var(--color-muted);
	}

	.send-btn {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		border: 0;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		cursor: pointer;
	}

	.send-btn svg {
		width: 14px;
		height: 14px;
		margin-right: 2px;
	}

	.disclaimer-text {
		padding: 0 10px;
	}

	.disclaimer-text p {
		font-size: 0.68rem;
		color: var(--color-muted);
		line-height: 1.45;
		margin: 0;
	}
</style>
