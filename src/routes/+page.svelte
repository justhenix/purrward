<script lang="ts">
	import { resolve } from '$app/paths';
	import Camera from '@lucide/svelte/icons/camera';
	import Cat from '@lucide/svelte/icons/cat';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Star from '@lucide/svelte/icons/star';
	import { deriveParentName } from '$lib/account-identity';
	import { getCatAvatar } from '$lib/cat-avatars';
	import { resolveProfileAvatar } from '$lib/profile-avatar';
	import { deriveCatState } from '$lib/cat-state';
	import PetScene from '$lib/components/home/PetScene.svelte';
	import logo from '$lib/assets/logo/logo.svg';
	import {
		resolveHomepageCatAvatar,
		type CatCoat,
		type CatMood,
		type CatPose
	} from '$lib/cat/homepage-avatar';
	import { habitSetFor } from '$lib/tasks';
	import type { TaskType } from '$lib/tasks';
	import type { PageProps } from './$types';

	type TaskMeta = {
		id: TaskType;
		label: string;
		heroTitle: string;
		proofLabel: string;
		reward: number;
	};

	const TASKS: TaskMeta[] = [
		{
			id: 'feeding',
			label: 'Feed',
			heroTitle: 'Breakfast',
			proofLabel: 'breakfast',
			reward: 10
		},
		{ id: 'water', label: 'Water', heroTitle: 'Fresh water', proofLabel: 'water', reward: 10 },
		{ id: 'litter', label: 'Litter', heroTitle: 'Litter', proofLabel: 'litter', reward: 10 },
		{ id: 'play', label: 'Play', heroTitle: 'Playtime', proofLabel: 'play', reward: 10 },
		{ id: 'grooming', label: 'Groom', heroTitle: 'Grooming', proofLabel: 'grooming', reward: 10 },
		{ id: 'meds', label: 'Meds', heroTitle: 'Medicine', proofLabel: 'meds', reward: 10 },
		{
			id: 'street_feeding',
			label: 'Street',
			heroTitle: 'Street feeding',
			proofLabel: 'feeding',
			reward: 10
		},
		{
			id: 'shelter_care',
			label: 'Shelter',
			heroTitle: 'Shelter care',
			proofLabel: 'care',
			reward: 10
		}
	];

	// Map a care task to the body pose that best represents doing it.
	function poseForTask(taskId: TaskType): CatPose {
		if (taskId === 'feeding' || taskId === 'street_feeding') return 'eat';
		if (taskId === 'water') return 'drink';
		if (taskId === 'play') return 'play';
		if (taskId === 'grooming') return 'groom';
		return 'sit';
	}

	let { data }: PageProps = $props();

	let switcherOpen = $state(false);
	let signedIn = $derived(Boolean(data.user));
	let cats = $derived(data.cats ?? []);
	let canSwitch = $derived(cats.length > 1);

	let habitSet = $derived(habitSetFor(data.activeCat?.careMode ?? 'owned'));
	let tasks = $derived(TASKS.filter((task) => habitSet.includes(task.id)));
	let completed = $derived(new Set(data.completedTasks));
	let doneCount = $derived(tasks.filter((task) => completed.has(task.id)).length);
	let allDone = $derived(doneCount === tasks.length);
	let nextTask = $derived(tasks.find((task) => !completed.has(task.id)) ?? tasks[0]);
	let requestedTask = $derived(
		data.selectedTask && !completed.has(data.selectedTask) ? data.selectedTask : nextTask.id
	);
	let active = $derived(tasks.find((task) => task.id === requestedTask) ?? nextTask);

	let profileAvatar = $derived(resolveProfileAvatar(data.user, data.preferences.avatarChoice));
	let firstName = $derived(deriveParentName(data.user).split(' ')[0]);
	let catName = $derived(data.activeCat?.name ?? 'Mochi');
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(sandboxMode ? 999999 : (data.user?.purrpoints ?? 0));

	// Lightweight pet state: mood + pose from today's care progress (signed-in only).
	let catState = $derived(
		deriveCatState({ completed: data.completedTasks, required: tasks.map((task) => task.id) })
	);
	let coat = $derived((data.activeCat?.avatarId ?? 'orange') as CatCoat);
	let catMood = $derived<CatMood>(
		!signedIn
			? 'normal'
			: catState === 'happy'
				? 'happy'
				: catState === 'hungry'
					? 'sad'
					: catState === 'sleeping'
						? 'sleepy'
						: 'normal'
	);
	let preferredPose = $derived<CatPose>(
		!signedIn
			? 'sit'
			: catState === 'sleeping'
				? 'sleep'
				: catState === 'hungry'
					? 'eat'
					: catState === 'happy'
						? 'sit'
						: poseForTask(active.id)
	);
	let heroCat = $derived(resolveHomepageCatAvatar({ coat, mood: catMood, preferredPose }));

	let rewardPoints = $derived(sandboxMode ? 1000 : active.reward);
</script>

<svelte:head>
	<title>Purrward | Home</title>
	<meta
		name="description"
		content="Care for your cat, scan proof, and earn Purrpoints for healthy routines."
	/>
</svelte:head>

<div class="home">
	<div class="scene-bleed">
		<PetScene
			catLayers={heroCat.renderStack}
			catWarnings={heroCat.warnings}
			catLabel={`${catName} in the park`}
			showCat={signedIn}
		>
			{#snippet top()}
				{#if signedIn}
					<div class="overlay-head">
						<div class="pet-hud">
							<p>Hi, {firstName}</p>
							<button
								type="button"
								class="cat-pill"
								aria-haspopup="true"
								aria-expanded={switcherOpen}
								onclick={() => (switcherOpen = !switcherOpen)}
							>
								<Cat size={15} strokeWidth={2.5} aria-hidden="true" />
								<span class="cat-pill-name">{catName}</span>
								{#if canSwitch}
									<ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
								{/if}
							</button>
						</div>
						<div class="hud-actions">
							<a class="points-hud" href={resolve('/rewards')} aria-label="Open rewards">
								<Star size={15} strokeWidth={2.5} aria-hidden="true" />
								<span>{balance} pts</span>
							</a>
							<a class="profile" href={resolve('/profile')} aria-label="Profile and settings">
								{#if profileAvatar.kind === 'image'}
									<img
										class={profileAvatar.cat ? 'profile-cat' : undefined}
										src={profileAvatar.src}
										alt=""
									/>
								{:else}
									<span>{profileAvatar.letter}</span>
								{/if}
							</a>
						</div>
					</div>
				{:else}
					<div class="overlay-head">
						<div class="brand-hud" aria-label="Purrward">
							<img src={logo} alt="" width="28" height="28" />
							<strong>Purrward</strong>
						</div>
					</div>
				{/if}
			{/snippet}

			{#snippet status()}
				{#if signedIn && allDone}
					<span class="status-bubble is-happy">
						<Sparkles size={14} strokeWidth={2.4} aria-hidden="true" />
						All care done today
					</span>
				{:else if signedIn}
					<span class="status-bubble">Waiting for {active.proofLabel}</span>
				{/if}
			{/snippet}

			{#snippet bottom()}
				{#if !signedIn}
					<div class="dock-stack signed-out">
						<div class="guest-cta">
							<div class="guest-copy">
								<strong>Start your cat's care day</strong>
								<p>Care routines, photo proof, and Purrpoints.</p>
							</div>
							<a class="scan-cta" href={resolve('/auth/login')}>
								<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
								<span>Sign in to meet your cat</span>
							</a>
							<p class="welcome-note">Photo proof keeps Purrpoints fair.</p>
						</div>
					</div>
				{:else if allDone}
					<div class="dock-stack">
						<div class="task-bubble rest">
							<div class="task-copy">
								<span class="task-eyebrow">Done today</span>
								<strong>{catName} is happy</strong>
							</div>
							<p class="rest-note">Come back tomorrow to keep the streak going.</p>
							<div class="mini-progress" aria-labelledby="progress-title">
								<div class="mini-progress-head">
									<span id="progress-title">{doneCount}/{tasks.length} care done</span>
									<a href={resolve('/care')} aria-label="Open full care plan">
										View tasks <ChevronRight size={14} strokeWidth={2.3} aria-hidden="true" />
									</a>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="dock-stack">
						<div class="task-bubble">
							<div class="task-row">
								<div class="task-copy">
									<span class="task-eyebrow">Next care</span>
									<strong>{active.heroTitle}</strong>
								</div>
								<span class="task-reward">+{rewardPoints} Purrpoints</span>
							</div>
							<a class="scan-cta" href={resolve(`/care-proof?task=${active.id}`)}>
								<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
								<span>Scan {active.proofLabel} photo</span>
							</a>
							<div class="mini-progress" aria-labelledby="progress-title">
								<div class="mini-progress-head">
									<span id="progress-title">{doneCount}/{tasks.length} care done</span>
									<a href={resolve('/care')} aria-label="Open full care plan">
										View tasks <ChevronRight size={14} strokeWidth={2.3} aria-hidden="true" />
									</a>
								</div>
							</div>
						</div>
					</div>
				{/if}
			{/snippet}
		</PetScene>
	</div>
</div>

{#if signedIn && switcherOpen && canSwitch}
	<button
		type="button"
		class="sheet-backdrop"
		aria-label="Close cat picker"
		onclick={() => (switcherOpen = false)}
	></button>
	<div class="sheet" role="dialog" aria-label="Choose a cat">
		<p class="sheet-title">Choose a cat</p>
		<ul class="sheet-list">
			{#each cats as cat (cat.id)}
				{@const avatar = getCatAvatar(cat.avatarId)}
				{@const isActive = cat.id === data.activeCat?.id}
				<li>
					<form method="POST" action="?/select">
						<input type="hidden" name="catId" value={cat.id} />
						<button type="submit" class={['sheet-row', isActive && 'active']}>
							<span class="sheet-avatar" aria-hidden="true">
								{#if avatar}<img src={avatar.src} alt="" />{/if}
							</span>
							<span class="sheet-name">{cat.name}</span>
							{#if isActive}
								<Check size={17} strokeWidth={3} aria-hidden="true" />
							{/if}
						</button>
					</form>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<!-- Home screen as a full pet scene: Mochi in the park, care bubbles floating on top. -->

<style>
	.home {
		min-height: 100dvh;
	}

	/* Break out of app padding so the park is the Home world, including behind the nav. */
	.scene-bleed {
		margin: -18px -20px -168px;
	}

	.overlay-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	.pet-hud {
		display: grid;
		gap: 7px;
		border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		border-radius: 22px;
		background: color-mix(in srgb, var(--color-paper-2) 82%, transparent);
		padding: 9px 10px 10px;
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-card);
	}

	.pet-hud p {
		margin: 0;
		color: var(--color-charcoal);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.brand-hud {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		border-radius: 22px;
		background: color-mix(in srgb, var(--color-paper-2) 84%, transparent);
		padding: 8px 13px 8px 9px;
		color: var(--color-ink);
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-card);
	}

	.brand-hud img {
		display: block;
		width: 28px;
		height: 28px;
		object-fit: contain;
	}

	.brand-hud strong {
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 800;
		line-height: 1;
	}

	.hud-actions {
		display: grid;
		justify-items: end;
		gap: 8px;
	}

	.points-hud {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border: 1px solid color-mix(in srgb, var(--color-line) 68%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-warning-bg) 86%, transparent);
		color: var(--color-warning-text);
		padding: 7px 10px;
		font-size: 0.78rem;
		font-weight: 900;
		text-decoration: none;
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-card);
	}

	.profile {
		display: grid;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-paper-2) 84%, transparent);
		color: var(--color-charcoal);
		font-size: 1rem;
		font-weight: 900;
		text-decoration: none;
		backdrop-filter: blur(7px);
		box-shadow: var(--shadow-card);
	}

	.profile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.profile img.profile-cat {
		padding: 6px;
		object-fit: contain;
	}

	.cat-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 72%, transparent);
		padding: 7px 14px 7px 10px;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 800;
		cursor: pointer;
	}

	.cat-pill :global(svg) {
		flex: none;
		color: var(--color-charcoal);
	}

	.status-bubble {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 1px solid color-mix(in srgb, var(--color-line) 66%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 82%, transparent);
		padding: 7px 15px;
		color: var(--color-charcoal);
		font-size: 0.84rem;
		font-weight: 800;
		backdrop-filter: blur(7px);
		box-shadow: var(--shadow-card);
	}

	.status-bubble.is-happy {
		background: color-mix(in srgb, var(--color-sage-soft) 88%, transparent);
		border-color: color-mix(in srgb, var(--color-success-text) 24%, var(--color-line));
		color: var(--color-success-text);
	}

	.task-bubble {
		display: grid;
		gap: 10px;
		min-height: 112px;
		border: 1px solid color-mix(in srgb, var(--color-line) 68%, transparent);
		border-radius: var(--radius-card);
		background: color-mix(in srgb, var(--color-paper-2) 86%, transparent);
		padding: 14px 15px 12px;
		backdrop-filter: blur(9px);
		box-shadow: var(--shadow-float);
	}

	.dock-stack {
		display: grid;
		gap: 8px;
	}

	.dock-stack.signed-out {
		max-width: 100%;
	}

	.guest-cta {
		display: grid;
		justify-items: center;
		gap: 12px;
		border: 1px solid color-mix(in srgb, var(--color-line) 68%, transparent);
		border-radius: var(--radius-card);
		background: color-mix(in srgb, var(--color-paper-2) 88%, transparent);
		padding: 18px 16px;
		text-align: center;
		backdrop-filter: blur(9px);
		box-shadow: var(--shadow-float);
	}

	.guest-copy {
		display: grid;
		gap: 4px;
	}

	.guest-copy strong {
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.18rem;
		line-height: 1.1;
	}

	.guest-copy p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 650;
		line-height: 1.36;
	}

	.task-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.task-copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.task-eyebrow {
		display: none;
		color: var(--color-muted);
		font-size: 0.72rem;
		font-weight: 850;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.task-copy strong {
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.task-reward {
		flex: none;
		border-radius: var(--radius-pill);
		background: var(--color-butter);
		color: var(--color-charcoal);
		padding: 5px 11px;
		font-size: 0.76rem;
		font-weight: 850;
	}

	.welcome-sub {
		margin: 0;
		color: var(--color-charcoal);
		font-size: 0.95rem;
		font-weight: 650;
		line-height: 1.36;
	}

	.welcome-note {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 650;
	}

	.rest-note {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 650;
		line-height: 1.36;
	}

	.scan-cta {
		display: inline-flex;
		width: 100%;
		min-height: 48px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 1rem;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 20%, transparent);
	}

	.mini-progress {
		display: grid;
		gap: 0;
		padding-top: 0;
	}

	.mini-progress-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.mini-progress-head a {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: inherit;
		text-decoration: none;
		white-space: nowrap;
	}

	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		border: 0;
		background: color-mix(in srgb, var(--color-charcoal) 32%, transparent);
		cursor: pointer;
	}

	.sheet {
		position: fixed;
		left: 50%;
		bottom: 0;
		z-index: 61;
		width: min(100%, 430px);
		transform: translateX(-50%);
		border-radius: 28px 28px 0 0;
		background: var(--color-paper-2);
		padding: 16px 18px calc(20px + env(safe-area-inset-bottom));
		box-shadow: 0 -14px 40px color-mix(in srgb, var(--color-charcoal) 16%, transparent);
	}

	.sheet-title {
		margin: 4px 0 12px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
		text-align: center;
	}

	.sheet-list {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		max-height: 52vh;
		overflow-y: auto;
		list-style: none;
	}

	.sheet-row {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper);
		padding: 10px 12px;
		color: var(--color-charcoal);
		font-size: 0.95rem;
		font-weight: 800;
		cursor: pointer;
	}

	.sheet-row.active {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		border-color: color-mix(in srgb, var(--color-success-text) 24%, var(--color-line));
	}

	.sheet-avatar {
		display: grid;
		width: 40px;
		height: 40px;
		flex: none;
		place-items: center;
		overflow: hidden;
		border-radius: 13px;
		background: var(--color-peach-soft);
	}

	.sheet-avatar img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
	}

	.sheet-name {
		flex: 1;
		overflow: hidden;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 360px) {
		.home {
			gap: 14px;
		}

		.scan-cta {
			font-size: 0.92rem;
		}
	}
</style>
