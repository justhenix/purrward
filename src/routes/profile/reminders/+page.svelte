<!-- Reminders submenu: local daily care reminder toggle and multiple reminder times. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Check from '@lucide/svelte/icons/check';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let careReminders = $derived(data.preferences.careReminders);
	let reminderTimes = $derived(data.preferences.reminderTimes);
	let selectedCareNudges = $derived(data.preferences.careNudges);
	let isGuest = $derived(!data.user);
	let editingTime = $state<string | null>(null);
	let addingTime = $state(false);
	let draftTime = $state('08:00');
	let newTime = $state('08:00');

	const nudgeOptions = [
		{ id: 'feed', label: 'Feed' },
		{ id: 'water', label: 'Water' },
		{ id: 'litter', label: 'Litter' },
		{ id: 'play', label: 'Play' },
		{ id: 'groom', label: 'Groom' },
		{ id: 'meds', label: 'Meds' }
	];

	function formatTime(value: string) {
		const [hourText = '8', minute = '00'] = value.split(':');
		const hour = Number(hourText);
		const period = hour >= 12 ? 'PM' : 'AM';
		return `${hour % 12 || 12}:${minute} ${period}`;
	}

	function savePreference(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.form?.requestSubmit();
	}

	function startEdit(time: string) {
		addingTime = false;
		editingTime = time;
		draftTime = time;
	}

	function startAdd() {
		editingTime = null;
		addingTime = true;
	}

	function keptTimes(time: string) {
		return reminderTimes.filter((item) => item !== time);
	}

	function isCareNudgeSelected(id: string) {
		return selectedCareNudges.includes(id);
	}
</script>

<svelte:head>
	<title>Purrward | Reminders</title>
</svelte:head>

<div class="reminders-screen">
	<header class="reminders-header">
		<a class="back-button" href={resolve('/profile')} aria-label="Back to profile">
			<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
		</a>
		<h1>Reminders</h1>
	</header>

	<form method="POST" action="?/reminder" class="panel">
		{#each reminderTimes as time (time)}
			<input name="reminderTimes" type="hidden" value={time} />
		{/each}
		<label class="toggle-row">
			<span class="row-copy">
				<strong>Care reminders</strong>
				<small>{careReminders ? 'On' : 'Off'}</small>
			</span>
			<input
				name="careReminders"
				type="checkbox"
				checked={careReminders}
				onchange={savePreference}
				aria-label="Care reminders"
			/>
		</label>
	</form>

	<section class={['panel', 'time-panel', !careReminders && 'is-muted']}>
		<div class="panel-heading">
			<div class="row-copy">
				<strong>Reminder times</strong>
				<small>{isGuest ? 'Guest mode. Saved on this device.' : 'Daily care nudges.'}</small>
			</div>
		</div>

		<ul class="time-list">
			{#each reminderTimes as time (time)}
				<li>
					{#if editingTime === time}
						<form method="POST" action="?/reminder" class="time-edit">
							<input name="careReminders" type="hidden" value="on" />
							<input name="careNudgesSubmitted" type="hidden" value="1" />
							{#each keptTimes(time) as kept (kept)}
								<input name="reminderTimes" type="hidden" value={kept} />
							{/each}
							<div class="time-edit-main">
								<input name="reminderTimes" type="time" bind:value={draftTime} required />
								<button class="primary-action" type="submit" disabled={!careReminders}>Save</button>
								<button class="secondary-action" type="button" onclick={() => (editingTime = null)}>
									Cancel
								</button>
							</div>
							<fieldset class="nudge-editor">
								<legend>Care nudges</legend>
								<div class="nudges">
									{#each nudgeOptions as nudge (nudge.id)}
										<label class="nudge-choice">
											<input
												name="careNudges"
												type="checkbox"
												value={nudge.id}
												checked={isCareNudgeSelected(nudge.id)}
												disabled={!careReminders}
											/>
											<span class="nudge-icon" aria-hidden="true">
												<Check size={14} strokeWidth={3} />
											</span>
											<span>{nudge.label}</span>
										</label>
									{/each}
								</div>
							</fieldset>
						</form>
					{:else}
						<span class="time-value">{formatTime(time)}</span>
						<div class="time-actions">
							<button
								class="secondary-action"
								type="button"
								disabled={!careReminders}
								onclick={() => startEdit(time)}
							>
								Edit
							</button>
							<form method="POST" action="?/reminder">
								<input name="careReminders" type="hidden" value="on" />
								{#each keptTimes(time) as kept (kept)}
									<input name="reminderTimes" type="hidden" value={kept} />
								{/each}
								<button
									class="secondary-action"
									type="submit"
									disabled={!careReminders || reminderTimes.length === 1}
								>
									Delete
								</button>
							</form>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if addingTime}
			<form method="POST" action="?/reminder" class="add-time">
				<input name="careReminders" type="hidden" value="on" />
				<input name="careNudgesSubmitted" type="hidden" value="1" />
				{#each reminderTimes as time (time)}
					<input name="reminderTimes" type="hidden" value={time} />
				{/each}
				<label>
					<span>Add time</span>
					<input name="reminderTimes" type="time" bind:value={newTime} required />
				</label>
				<div class="add-time-actions">
					<button class="primary-action" type="submit" disabled={!careReminders}>Save</button>
					<button class="secondary-action" type="button" onclick={() => (addingTime = false)}>
						Cancel
					</button>
				</div>
				<fieldset class="nudge-editor">
					<legend>Care nudges</legend>
					<div class="nudges">
						{#each nudgeOptions as nudge (nudge.id)}
							<label class="nudge-choice">
								<input
									name="careNudges"
									type="checkbox"
									value={nudge.id}
									checked={isCareNudgeSelected(nudge.id)}
									disabled={!careReminders}
								/>
								<span class="nudge-icon" aria-hidden="true">
									<Check size={14} strokeWidth={3} />
								</span>
								<span>{nudge.label}</span>
							</label>
						{/each}
					</div>
				</fieldset>
			</form>
		{:else}
			<div class="add-time-start">
				<span>Add time</span>
				<button class="secondary-action" type="button" disabled={!careReminders} onclick={startAdd}>
					Add time
				</button>
			</div>
		{/if}
	</section>
</div>

<style>
	.reminders-screen {
		display: grid;
		gap: 14px;
		padding-bottom: calc(28px + env(safe-area-inset-bottom));
	}

	.reminders-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 4px;
	}

	.back-button {
		display: grid;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: var(--shadow-card);
	}

	.reminders-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.panel {
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.is-muted {
		opacity: 0.62;
	}

	.toggle-row,
	.panel-heading {
		padding: 16px;
	}

	.toggle-row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px;
		cursor: pointer;
	}

	.row-copy {
		min-width: 0;
	}

	.row-copy strong {
		display: block;
		margin-bottom: 2px;
		color: var(--color-ink);
		font-size: 0.95rem;
	}

	.row-copy small {
		display: block;
		margin-top: 2px;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 650;
	}

	.time-panel {
		overflow: hidden;
	}

	.time-list {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.time-list li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		border-top: 1px solid var(--color-line);
		padding: 12px 16px;
	}

	.time-value {
		color: var(--color-ink);
		font-size: 0.96rem;
		font-weight: 850;
	}

	.time-actions,
	.time-edit-main {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.time-edit {
		grid-column: 1 / -1;
		display: grid;
		gap: 10px;
	}

	.time-edit input[type='time'],
	.add-time input[type='time'] {
		min-height: 40px;
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 7px 10px;
		font: inherit;
		font-weight: 800;
	}

	.add-time {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		align-items: end;
		border-top: 1px solid var(--color-line);
		padding: 14px 16px 16px;
	}

	.add-time-start {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		align-items: center;
		border-top: 1px solid var(--color-line);
		padding: 14px 16px 16px;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.add-time-actions {
		display: flex;
		align-items: end;
		gap: 8px;
	}

	.add-time > label {
		display: grid;
		gap: 6px;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.primary-action,
	.secondary-action {
		min-height: 38px;
		border-radius: var(--radius-pill);
		padding: 0 14px;
		font-size: 0.8rem;
		font-weight: 850;
		cursor: pointer;
	}

	.primary-action {
		border: 1px solid var(--color-charcoal);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
	}

	.secondary-action {
		border: 1px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-charcoal);
	}

	.primary-action:disabled,
	.secondary-action:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.nudges {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.nudge-editor {
		grid-column: 1 / -1;
		min-width: 0;
		margin: 0;
		border: 0;
		padding: 2px 0 0;
	}

	.nudge-editor legend {
		margin-bottom: 8px;
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 850;
	}

	.nudge-choice {
		display: flex;
		position: relative;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper);
		color: var(--color-muted);
		padding: 10px 12px;
		font-size: 0.8rem;
		font-weight: 800;
		cursor: pointer;
	}

	.nudge-choice:has(input:checked) {
		background: color-mix(in srgb, var(--color-sage-soft) 38%, var(--color-paper-2));
		color: var(--color-charcoal);
	}

	.nudge-choice:has(input:disabled) {
		cursor: not-allowed;
	}

	.nudge-choice input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.nudge-choice:has(input:focus-visible) {
		outline: 2px solid color-mix(in srgb, var(--color-charcoal) 34%, transparent);
		outline-offset: 2px;
	}

	.nudge-icon {
		display: grid;
		width: 22px;
		height: 22px;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-success-text);
		opacity: 0.28;
	}

	.nudge-choice:has(input:checked) .nudge-icon {
		opacity: 1;
	}

	.toggle-row input {
		appearance: none;
		position: relative;
		width: 48px;
		height: 30px;
		border: 1px solid color-mix(in srgb, var(--color-charcoal) 14%, transparent);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		cursor: pointer;
		transition: background 140ms ease;
	}

	.toggle-row input::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-paper-2);
		box-shadow: 0 2px 8px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
		transition: transform 140ms ease;
	}

	.toggle-row input:checked {
		background: var(--color-charcoal);
	}

	.toggle-row input:checked::after {
		transform: translateX(18px);
	}

	@media (max-width: 360px) {
		.time-list li,
		.add-time,
		.add-time-start {
			grid-template-columns: 1fr;
		}

		.time-actions,
		.add-time-actions {
			justify-content: start;
		}
	}
</style>
