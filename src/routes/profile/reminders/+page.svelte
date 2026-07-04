<!-- Reminders submenu: daily care reminder toggle, reminder time, and care coverage. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Check from '@lucide/svelte/icons/check';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let careReminders = $derived(data.preferences.careReminders);
	let reminderTime = $derived(data.preferences.reminderTime);
	let draftTime = $state('08:00');
	let customTime = $state('08:00');
	let pickerOpen = $state(false);

	const nudges = ['Feed', 'Water', 'Litter', 'Play', 'Groom', 'Meds'];
	const timePresets = [
		{ label: 'Morning', value: '08:00' },
		{ label: 'Noon', value: '12:00' },
		{ label: 'Evening', value: '18:00' },
		{ label: 'Night', value: '21:00' }
	] as const;

	let draftChoice = $state<string>('Morning');

	function getTimeChoice(value: string) {
		return timePresets.find((preset) => preset.value === value)?.label ?? 'Custom';
	}

	function formatTime(value: string) {
		const [hourText = '8', minute = '00'] = value.split(':');
		const hour = Number(hourText);
		const period = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minute} ${period}`;
	}

	function resetDraft() {
		draftTime = reminderTime;
		draftChoice = getTimeChoice(reminderTime);
		customTime = reminderTime;
	}

	function savePreference(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.form?.requestSubmit();
	}

	function openPicker() {
		if (!careReminders) return;
		resetDraft();
		pickerOpen = true;
	}

	function closePicker() {
		resetDraft();
		pickerOpen = false;
	}

	function pickPreset(label: string, value: string) {
		draftChoice = label;
		draftTime = value;
	}

	function pickCustom() {
		draftChoice = 'Custom';
		draftTime = customTime;
	}

	function updateCustomTime(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		customTime = input.value;
		draftTime = input.value;
	}

	function saveTime() {
		pickerOpen = false;
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

	<div class="reminder-forms">
		<form method="POST" action="?/reminder" class="panel">
			<input name="reminderTime" type="hidden" value={reminderTime} />
			<label class="toggle-row">
				<span class="row-copy">
					<strong>Daily reminder</strong>
					<small>Gentle care nudge.</small>
					{#if !careReminders}
						<small>Turn on to get reminders.</small>
					{/if}
				</span>
				<input
					name="careReminders"
					type="checkbox"
					checked={careReminders}
					onchange={savePreference}
					aria-label="Daily reminder"
				/>
			</label>
		</form>

		<form
			method="POST"
			action="?/reminder"
			class={['panel', 'time-panel', !careReminders && 'is-muted']}
		>
			<input name="careReminders" type="hidden" value="on" />
			<input name="reminderTime" type="hidden" value={draftTime} />
			<button
				class="time-row"
				type="button"
				onclick={openPicker}
				disabled={!careReminders}
				aria-expanded={pickerOpen}
			>
				<span class="row-copy">
					<strong>Reminder time</strong>
				</span>
				<span class="time-value">
					<span>{formatTime(reminderTime)}</span>
					<span class="change-copy">Change</span>
					<ChevronRight size={17} strokeWidth={2.4} aria-hidden="true" />
				</span>
			</button>

			{#if pickerOpen}
				<div class="picker" aria-label="Pick a time">
					<h2>Pick a time</h2>
					<div class="preset-grid">
						{#each timePresets as preset (preset.label)}
							<button
								class:active-choice={draftChoice === preset.label}
								type="button"
								onclick={() => pickPreset(preset.label, preset.value)}
							>
								<span>{preset.label}</span>
								<small>{formatTime(preset.value)}</small>
							</button>
						{/each}
						<button
							class:active-choice={draftChoice === 'Custom'}
							type="button"
							onclick={pickCustom}
						>
							<span>Custom</span>
							<small>{formatTime(customTime)}</small>
						</button>
					</div>

					{#if draftChoice === 'Custom'}
						<label class="custom-time">
							<span>Custom</span>
							<input type="time" value={customTime} oninput={updateCustomTime} />
						</label>
					{/if}

					<div class="picker-actions">
						<button class="secondary-action" type="button" onclick={closePicker}>Cancel</button>
						<button class="primary-action" type="submit" onclick={saveTime}>Save</button>
					</div>
				</div>
			{/if}
		</form>
	</div>

	<div class={['panel', 'nudge-panel', !careReminders && 'is-muted']}>
		<span class="row-copy">
			<strong>Care nudges</strong>
			<small>Included in daily reminders.</small>
		</span>
		<ul class="nudges">
			{#each nudges as nudge (nudge)}
				<li>
					<span class="nudge-icon" aria-hidden="true">
						<Check size={14} strokeWidth={3} />
					</span>
					<span>{nudge}</span>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.reminders-screen {
		display: grid;
		gap: 14px;
		padding-bottom: calc(28px + env(safe-area-inset-bottom));
	}

	.reminder-forms {
		display: grid;
		gap: 14px;
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
		font-size: 1.5rem;
		font-family: var(--font-display);
	}

	.panel {
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.is-muted {
		opacity: 0.58;
	}

	.toggle-row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 16px;
		cursor: pointer;
	}

	.time-panel {
		overflow: hidden;
	}

	.nudge-panel {
		display: grid;
		gap: 14px;
		padding: 16px;
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

	.time-row {
		display: grid;
		width: 100%;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px;
		border: 0;
		background: transparent;
		color: var(--color-charcoal);
		padding: 16px;
		text-align: left;
		cursor: pointer;
	}

	.time-row:disabled {
		cursor: default;
	}

	.time-value {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: var(--color-ink);
		font-size: 0.94rem;
		font-weight: 700;
	}

	.change-copy {
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.picker {
		display: grid;
		gap: 10px;
		border-top: 1px solid var(--color-line);
		padding: 12px 16px 14px;
		background: color-mix(in srgb, var(--color-paper-3) 38%, var(--color-paper-2));
	}

	.picker h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1rem;
		font-family: var(--font-display);
	}

	.preset-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.preset-grid button {
		display: grid;
		gap: 2px;
		min-height: 52px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		padding: 9px 10px;
		text-align: left;
		cursor: pointer;
	}

	.preset-grid button span {
		font-size: 0.8rem;
		font-weight: 850;
	}

	.preset-grid button small {
		color: var(--color-muted);
		font-size: 0.7rem;
		font-weight: 750;
	}

	.preset-grid button.active-choice {
		border-color: color-mix(in srgb, var(--color-sage) 70%, var(--color-line));
		background: var(--color-sage-soft);
	}

	.custom-time {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		padding: 10px 12px;
		color: var(--color-charcoal);
		font-size: 0.84rem;
		font-weight: 850;
	}

	.custom-time input {
		width: 112px;
		border: 1px solid var(--color-line);
		border-radius: 14px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 8px 10px;
		font: inherit;
		font-weight: 800;
	}

	.picker-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.picker-actions button {
		min-height: 42px;
		border-radius: var(--radius-pill);
		padding: 10px 14px;
		font-size: 0.84rem;
		font-weight: 850;
		cursor: pointer;
	}

	.secondary-action {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
	}

	.primary-action {
		border: 1px solid var(--color-charcoal);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
	}

	.nudges {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.nudges li {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: color-mix(in srgb, var(--color-sage-soft) 34%, var(--color-paper-2));
		color: var(--color-charcoal);
		padding: 10px 12px;
		font-size: 0.8rem;
		font-weight: 800;
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
		.time-row {
			grid-template-columns: 1fr;
		}

		.time-value {
			justify-content: space-between;
		}
	}

	@media (max-width: 340px) {
		.preset-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
