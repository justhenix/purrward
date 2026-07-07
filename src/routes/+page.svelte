<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Camera from '@lucide/svelte/icons/camera';
	import Cat from '@lucide/svelte/icons/cat';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Plus from '@lucide/svelte/icons/plus';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Star from '@lucide/svelte/icons/star';
	import { deriveParentName } from '$lib/account-identity';
	import { getCatAvatar } from '$lib/cat-avatars';
	import { resolveProfileAvatar } from '$lib/profile-avatar';
	import { deriveCatState } from '$lib/cat-state';
	import PetScene from '$lib/components/home/PetScene.svelte';
	import SceneItem from '$lib/components/SceneItem.svelte';
	import logo from '$lib/assets/logo/logo.svg';
	import bgRoom from '$lib/assets/bg/bg-room.webp';
	import bgRoomDark from '$lib/assets/bg/bg-room-dark.webp';
	import bgPark from '$lib/assets/bg/bg_park.webp';
	import bgParkDark from '$lib/assets/bg/bg_park_night.webp';
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
	type SceneActionForm = { sceneError?: string; sceneMessage?: string };
	type BackgroundScene = PageProps['data']['backgroundScenes'][number];
	type BackgroundId = BackgroundScene['id'];

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

	function greetingName(value: string): string {
		const trimmed = value.trim();
		if (!trimmed || trimmed.length > 14 || /\d{7,}/.test(trimmed) || trimmed.startsWith('ga-')) {
			return '';
		}
		return trimmed;
	}

	let { data, form }: PageProps = $props();

	let switcherOpen = $state(false);
	let sceneSheetOpen = $state(false);
	let dismissedSceneAction = $state(false);
	let signedIn = $derived(Boolean(data.user));
	let cats = $derived(data.cats ?? []);
	let sceneAction = $derived((form ?? {}) as SceneActionForm);
	let sceneError = $derived(sceneAction.sceneError ?? '');
	let sceneMessage = $derived(sceneAction.sceneMessage ?? '');
	let sceneActionOpen = $derived(Boolean(sceneError || sceneMessage));
	let showSceneMessage = $derived(sceneActionOpen && !dismissedSceneAction);
	let showSceneSheet = $derived(sceneSheetOpen || (sceneActionOpen && !dismissedSceneAction));
	let equippedScene = $derived(
		data.backgroundScenes.find((scene) => scene.equipped) ?? data.backgroundScenes[0]
	);
	let visibleScene = $derived(equippedScene);

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
	let firstName = $derived(greetingName(deriveParentName(data.user).split(' ')[0] ?? ''));
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
	let equippedAccessoryAssets = $derived(data.equippedAccessories.map((item) => item.assetId));
	let heroCat = $derived(
		resolveHomepageCatAvatar({
			coat,
			mood: catMood,
			preferredPose,
			accessories: equippedAccessoryAssets
		})
	);

	let rewardPoints = $derived(sandboxMode ? 1000 : active.reward);

	function openSceneSheet() {
		switcherOpen = false;
		dismissedSceneAction = true;
		sceneSheetOpen = true;
	}

	function closeSceneSheet() {
		sceneSheetOpen = false;
		dismissedSceneAction = true;
	}

	function sceneThumbStyle(id: BackgroundId): string {
		const thumb =
			id === 'bg_park' ? { light: bgPark, dark: bgParkDark } : { light: bgRoom, dark: bgRoomDark };
		const position = id === 'bg_park' ? '50% 58%' : '50% 76%';
		return `--scene-thumb-light: url(${thumb.light}); --scene-thumb-dark: url(${thumb.dark}); --scene-thumb-position: ${position};`;
	}

	const sceneEnhance: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				closeSceneSheet();
			} else {
				dismissedSceneAction = false;
			}
		};
	};
</script>

<svelte:head>
	<title>Purrward | Home</title>
	<meta
		name="description"
		content="Care for your cat, scan proof, and earn Purrpoints for healthy routines."
	/>
</svelte:head>

<div class="home">
	<div class={['scene-bleed', showSceneSheet && 'scene-bleed-picker']}>
		<PetScene
			catLayers={heroCat.renderStack}
			catWarnings={heroCat.warnings}
			catLabel={`${catName} in the ${visibleScene?.title.toLowerCase() ?? 'room'}`}
			sceneId={visibleScene?.id}
			showCat={signedIn}
		>
			{#snippet top()}
				{#if signedIn}
					<div class="overlay-head">
						<div class="pet-hud">
							<p>{firstName ? `Hi, ${firstName}` : 'Hi'}</p>
							<button
								type="button"
								class="cat-pill"
								aria-haspopup="dialog"
								aria-expanded={switcherOpen}
								onclick={() => {
									closeSceneSheet();
									switcherOpen = !switcherOpen;
								}}
							>
								<Cat size={15} strokeWidth={2.5} aria-hidden="true" />
								<span class="cat-pill-name">{catName}</span>
								<ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
							</button>
						</div>
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
				{:else}
					<div class="overlay-head">
						<div class="brand-hud" aria-label="Purrward">
							<img src={logo} alt="" width="28" height="28" />
							<strong>Purrward</strong>
						</div>
					</div>
				{/if}
			{/snippet}

			{#snippet sceneControl()}
				{#if signedIn}
					<button
						type="button"
						class="scene-chip"
						aria-haspopup="dialog"
						aria-expanded={showSceneSheet}
						onclick={openSceneSheet}
					>
						<ImageIcon size={15} strokeWidth={2.4} aria-hidden="true" />
						<span>Scene</span>
					</button>
				{/if}
			{/snippet}

			{#snippet status()}
				{#if signedIn && allDone}
					<span class="status-bubble is-happy">
						<Sparkles size={14} strokeWidth={2.4} aria-hidden="true" />
						Done today
					</span>
				{/if}
			{/snippet}

			{#snippet care()}
				{#if signedIn && !allDone}
					<div class="care-action-bubble">
						<strong>{active.heroTitle}</strong>
						<span class="reward-chip">+{rewardPoints} pts</span>
						<a class="scan-chip" href={resolve(`/care-proof?task=${active.id}`)}>
							<Camera size={14} strokeWidth={2.4} aria-hidden="true" />
							<span>Scan</span>
						</a>
					</div>
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
				{/if}
			{/snippet}
		</PetScene>
	</div>
</div>

{#if signedIn && switcherOpen}
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
							<span class="sheet-name">
								{cat.name}
								<span class="sheet-mode"
									>({cat.careMode === 'community' ? 'community' : 'pet'})</span
								>
							</span>
							{#if isActive}
								<Check size={17} strokeWidth={3} aria-hidden="true" />
							{/if}
						</button>
					</form>
				</li>
			{/each}
			<li>
				<a class="sheet-row add-cat-row" href={resolve('/cats')}>
					<span class="sheet-avatar add-avatar" aria-hidden="true">
						<Plus size={19} strokeWidth={2.5} />
					</span>
					<span class="sheet-name">Add cat</span>
				</a>
			</li>
		</ul>
	</div>
{/if}

{#if signedIn && showSceneSheet}
	<button
		type="button"
		class="sheet-backdrop scene-backdrop"
		aria-label="Close scene picker"
		onclick={closeSceneSheet}
	></button>
	<div class="sheet scene-sheet" role="dialog" aria-label="Scene">
		<div class="sheet-heading">
			<p class="sheet-title">Scene</p>
		</div>
		{#if showSceneMessage}
			<p class={['scene-message', sceneError && 'warn']}>{sceneError || sceneMessage}</p>
		{/if}
		<ul class="sheet-list scene-list">
			{#each data.backgroundScenes as scene (scene.id)}
				<li>
					<SceneItem
						name={scene.title}
						thumbnailStyle={sceneThumbStyle(scene.id)}
						owned={scene.owned || scene.equipped}
						equipped={scene.equipped}
						price={scene.cost}
					>
						{#if scene.equipped}
							<button type="button" class="scene-row-btn" disabled>Equipped</button>
						{:else if scene.owned && data.activeCat}
							<form
								class="scene-row-form"
								method="POST"
								action="?/equipScene"
								use:enhance={sceneEnhance}
							>
								<input type="hidden" name="itemId" value={scene.id} />
								<button type="submit" class="scene-row-btn primary">Use</button>
							</form>
						{:else}
							<form
								class="scene-row-form"
								method="POST"
								action="?/unlockScene"
								use:enhance={sceneEnhance}
							>
								<input type="hidden" name="itemId" value={scene.id} />
								<button type="submit" class="scene-row-btn primary">Unlock</button>
							</form>
						{/if}
					</SceneItem>
				</li>
			{/each}
		</ul>
		<button type="button" class="cancel-btn" onclick={closeSceneSheet}>Cancel</button>
	</div>
{/if}

<!-- Home screen as a full pet scene: Mochi in the room, care bubbles floating on top. -->

<style>
	.home {
		min-height: 100dvh;
	}

	/* Break out of app padding so the park is the Home world, including behind the nav. */
	.scene-bleed {
		margin: -18px -20px calc(0px - var(--app-page-bottom));
	}

	.scene-bleed-picker :global(.scene-cat) {
		top: 62%;
	}

	.overlay-head {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 46px;
		align-items: flex-start;
		gap: 14px;
		min-height: 48px;
	}

	.pet-hud {
		display: grid;
		gap: 7px;
		max-width: 126px;
		border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		border-radius: 22px;
		background: color-mix(in srgb, var(--color-paper-2) 82%, transparent);
		padding: 8px 9px 9px;
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-card);
	}

	.pet-hud p {
		margin: 0;
		color: var(--color-charcoal);
		font-size: 0.78rem;
		font-weight: 800;
		line-height: 1.12;
		overflow-wrap: anywhere;
	}

	.brand-hud {
		display: inline-flex;
		width: max-content;
		max-width: 100%;
		justify-self: start;
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

	.points-hud {
		position: absolute;
		top: 0;
		left: 50%;
		z-index: 2;
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
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.points-hud:active {
		transform: translateX(-50%) translateY(1px) scale(0.98);
	}

	.profile {
		display: grid;
		width: 44px;
		height: 44px;
		flex: 0 0 auto;
		justify-self: end;
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
		max-width: 100%;
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

	.cat-pill-name {
		min-width: 0;
		line-height: 1.1;
		overflow-wrap: anywhere;
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

	.care-action-bubble {
		display: flex;
		width: max-content;
		max-width: min(86vw, 292px);
		min-height: 38px;
		align-items: center;
		gap: 7px;
		border: 1px solid color-mix(in srgb, var(--color-line) 68%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 94%, transparent);
		padding: 5px 6px 5px 12px;
		color: var(--color-ink);
		box-shadow: none;
	}

	.care-action-bubble strong {
		min-width: 0;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 0.92rem;
		font-weight: 800;
		line-height: 1.05;
		overflow-wrap: anywhere;
	}

	.reward-chip {
		flex: none;
		border-radius: var(--radius-pill);
		background: var(--color-butter);
		color: var(--color-charcoal);
		padding: 4px 7px;
		font-size: 0.7rem;
		font-weight: 850;
		white-space: nowrap;
	}

	.dock-stack {
		display: grid;
		gap: 8px;
		justify-items: stretch;
	}

	.scene-chip {
		justify-self: end;
		display: inline-flex;
		min-height: 28px;
		align-items: center;
		gap: 4px;
		border: 1px solid color-mix(in srgb, var(--color-line) 62%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-paper-2) 72%, transparent);
		color: var(--color-muted);
		padding: 0 9px;
		font-size: 0.72rem;
		font-weight: 800;
		box-shadow: none;
		cursor: pointer;
	}

	.scene-chip :global(svg) {
		flex: none;
		width: 13px;
		height: 13px;
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

	.scan-cta {
		display: inline-flex;
		width: 100%;
		min-height: 34px;
		align-items: center;
		justify-content: center;
		gap: 5px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 0.82rem;
		font-weight: 900;
		text-decoration: none;
		box-shadow: none;
	}

	.scan-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-height: 30px;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 0 10px;
		font-size: 0.78rem;
		font-weight: 900;
		text-decoration: none;
		white-space: nowrap;
	}

	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		border: 0;
		background: color-mix(in srgb, var(--color-dark-bg) 32%, transparent);
		cursor: pointer;
	}

	.scene-backdrop {
		background: transparent;
	}

	.sheet {
		position: fixed;
		left: 50%;
		bottom: calc(var(--app-safe-bottom) - 8px);
		z-index: 61;
		width: min(calc(100% - 24px), 406px);
		max-height: calc(100dvh - var(--app-safe-bottom) - 32px);
		transform: translateX(-50%);
		border: 1px solid var(--color-line);
		border-radius: 24px;
		background: var(--color-paper-2);
		padding: 12px 14px 14px;
		box-shadow: var(--shadow-card);
	}

	.scene-sheet {
		bottom: var(--app-safe-bottom);
		width: min(calc(100% - 24px), 406px);
		border: 1px solid var(--color-line);
		border-radius: 22px;
		padding: 10px;
		box-shadow: none;
	}

	.sheet-heading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 2px 0 10px;
	}

	.sheet-title {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
		text-align: center;
	}

	.scene-sheet .sheet-heading {
		margin: 0 0 8px;
	}

	.scene-sheet .sheet-list {
		max-height: min(52vh, 360px);
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

	.scene-list {
		gap: 7px;
	}

	.scene-message {
		margin: 0 0 10px;
		border-radius: 16px;
		background: var(--color-success-bg);
		color: var(--color-success-text);
		padding: 10px 12px;
		font-size: 0.82rem;
		font-weight: 800;
		text-align: center;
	}

	.scene-message.warn {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.scene-row-form {
		margin: 0;
	}

	.scene-row-btn {
		min-height: 34px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		color: var(--color-muted);
		padding: 0 12px;
		font-size: 0.78rem;
		font-weight: 850;
		white-space: nowrap;
	}

	.cancel-btn {
		width: 100%;
		min-height: 34px;
		margin-top: 7px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper);
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 850;
		cursor: pointer;
	}

	.scene-row-btn.primary {
		border: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		cursor: pointer;
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

	.add-cat-row {
		text-decoration: none;
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

	.add-avatar {
		background: var(--color-paper-3);
		color: var(--color-muted);
	}

	.sheet-name {
		flex: 1;
		text-align: left;
		overflow-wrap: anywhere;
	}

	.sheet-mode {
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 800;
	}

	@media (max-width: 360px) {
		.home {
			gap: 14px;
		}

		.scan-cta {
			font-size: 0.78rem;
		}

		.care-action-bubble {
			max-width: calc(100vw - 32px);
			flex-wrap: wrap;
			padding: 6px;
		}

		.scene-row-form,
		.scene-row-btn {
			width: 100%;
		}
	}

	@media (max-height: 740px) {
		.scene-bleed-picker :global(.scene-cat) {
			top: 58%;
		}

		.care-action-bubble {
			gap: 5px;
			min-height: 34px;
			padding-block: 4px;
		}

		.care-action-bubble strong {
			font-size: 0.86rem;
		}
	}
</style>
