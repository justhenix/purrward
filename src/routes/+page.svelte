<script lang="ts">
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import Brush from '@lucide/svelte/icons/brush';
	import Camera from '@lucide/svelte/icons/camera';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Gift from '@lucide/svelte/icons/gift';
	import Heart from '@lucide/svelte/icons/heart';
	import Pill from '@lucide/svelte/icons/pill';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Star from '@lucide/svelte/icons/star';
	import type { PageProps } from './$types';

	type TaskType = 'feeding' | 'water' | 'litter' | 'play' | 'grooming' | 'meds';
	type VerifyBody = {
		verified?: boolean;
		reason?: string;
		pointsAwarded?: number;
		error?: string;
	};
	type CareTask = {
		id: TaskType;
		name: string;
		status: 'Pending' | 'Done' | 'Proof needed';
		points: string;
		proof: string;
		tone: 'peach' | 'sky' | 'sage' | 'butter' | 'lavender';
	};
	type FlowStep = {
		title: string;
		subtitle: string;
		tone: 'peach' | 'butter' | 'sage' | 'lavender';
	};

	let tasks = $state<CareTask[]>([
		{
			id: 'feeding',
			name: 'Feed',
			status: 'Pending',
			points: '+10 pts',
			proof: 'photo proof',
			tone: 'peach'
		},
		{
			id: 'water',
			name: 'Water',
			status: 'Done',
			points: '+10 pts',
			proof: 'verified',
			tone: 'sky'
		},
		{
			id: 'litter',
			name: 'Litter',
			status: 'Pending',
			points: '+10 pts',
			proof: 'photo proof',
			tone: 'lavender'
		},
		{
			id: 'play',
			name: 'Play',
			status: 'Proof needed',
			points: '+10 pts',
			proof: 'upload',
			tone: 'butter'
		},
		{
			id: 'grooming',
			name: 'Groom',
			status: 'Pending',
			points: '+10 pts',
			proof: 'photo proof',
			tone: 'sage'
		},
		{
			id: 'meds',
			name: 'Meds',
			status: 'Pending',
			points: '+10 pts',
			proof: 'photo proof',
			tone: 'peach'
		}
	]);

	const flowSteps: FlowStep[] = [
		{ title: 'Care', subtitle: 'Feed Mochi', tone: 'peach' },
		{ title: 'Proof', subtitle: 'Upload photo', tone: 'butter' },
		{ title: 'Points', subtitle: 'Earn Purrpoints', tone: 'sage' },
		{ title: 'Redeem', subtitle: 'Get rewards', tone: 'lavender' }
	];

	let { data }: PageProps = $props();
	let selectedTask = $derived(data.selectedTask);
	let selectedFile = $state('No photo chosen');
	let verifying = $state(false);
	let result = $state<VerifyBody | null>(null);

	let profileInitial = $derived(data.user?.displayName?.slice(0, 1).toUpperCase() ?? 'P');
	let selectedTaskLabel = $derived(tasks.find((task) => task.id === selectedTask)?.name ?? 'care');

	// Digital Twin derived properties
	let completedCount = $derived(tasks.filter((t) => t.status === 'Done').length);
	let totalTasks = $derived(tasks.length);

	let nextTask = $derived(tasks.find((t) => t.status !== 'Done'));

	let bubbleTitle = $derived(
		!nextTask
			? 'Mochi is happy!'
			: nextTask.id === 'feeding'
				? 'Mochi is hungry'
				: nextTask.id === 'water'
					? 'Mochi is thirsty'
					: nextTask.id === 'litter'
						? 'Litter box is untidy'
						: nextTask.id === 'play'
							? 'Mochi wants to play'
							: nextTask.id === 'grooming'
								? 'Mochi needs brushing'
								: 'Mochi needs medication care'
	);

	let bubbleText = $derived(
		!nextTask
			? 'All cared for today. Great job!'
			: nextTask.id === 'feeding'
				? 'Needs lunch! Feed Mochi real food.'
				: nextTask.id === 'water'
					? 'Fill the real water bowl with fresh water.'
					: nextTask.id === 'litter'
						? 'Clean the real litter box.'
						: nextTask.id === 'play'
							? 'Time to play with Mochi!'
							: nextTask.id === 'grooming'
								? 'Brush Mochi gently.'
								: 'Log medication care.'
	);

	let tasksLeftText = $derived(
		totalTasks - completedCount === 0
			? 'Completed today!'
			: `${totalTasks - completedCount} care tasks left`
	);

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		selectedFile = input.files?.[0]?.name ?? 'No photo chosen';
		result = null;
	}

	async function verifyPhoto(event: SubmitEvent) {
		event.preventDefault();
		if (!data.user || verifying) return;

		verifying = true;
		result = null;

		const form = event.currentTarget as HTMLFormElement;
		const response = await fetch('/api/verify', {
			method: 'POST',
			body: new FormData(form)
		});
		const body = (await response.json()) as VerifyBody;
		result = body;
		if (response.ok && body.pointsAwarded) {
			const taskIdx = tasks.findIndex((t) => t.id === selectedTask);
			if (taskIdx !== -1 && body.verified) {
				tasks[taskIdx].status = 'Done';
			}
			await invalidateAll();
		}
		verifying = false;
	}
</script>

<!-- Home app screen centered on Mochi, daily care, proof, points, and rewards. -->

{#snippet taskIcon(type: TaskType, size = 23, strokeWidth = 2.1)}
	{#if type === 'feeding'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M5 13c1-3 3-5 7-5s6 2 7 5" />
			<path d="M3 13h18l-1.5 6.5c-.3 1.2-1.4 2.1-2.7 2.1H7.2c-1.3 0-2.4-.9-2.7-2.1L3 13Z" />
			<circle cx="12" cy="17" r="1.5" fill="currentColor" />
			<circle cx="9.5" cy="14.5" r="0.7" fill="currentColor" />
			<circle cx="11" cy="13.5" r="0.7" fill="currentColor" />
			<circle cx="13" cy="13.5" r="0.7" fill="currentColor" />
			<circle cx="14.5" cy="14.5" r="0.7" fill="currentColor" />
		</svg>
	{:else if type === 'water'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
		</svg>
	{:else if type === 'litter'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M3 13v6c0 1.6 1.4 3 3 3h12c1.6 0 3-1.4 3-3v-6" />
			<path d="M3 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
			<path d="M16 6l-2.5 4.5" />
			<path d="M11 10.5h5v3.5h-5Z" />
			<circle cx="7" cy="18" r="0.6" fill="currentColor" />
			<circle cx="10" cy="19" r="0.6" fill="currentColor" />
			<circle cx="14" cy="18.5" r="0.6" fill="currentColor" />
		</svg>
	{:else if type === 'play'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M3 21 17 7" />
			<path d="M17 7c1 2 1.5 4 0 6.5" stroke-dasharray="1 1" />
			<circle cx="17" cy="15.5" r="2" />
			<path d="M17 17.5v2.5M16 17.2l-1.5 2M18 17.2l1.5 2" />
		</svg>
	{:else if type === 'grooming'}
		<Brush {size} {strokeWidth} aria-hidden="true" />
	{:else if type === 'meds'}
		<Pill {size} {strokeWidth} aria-hidden="true" />
	{/if}
{/snippet}

<svelte:head>
	<title>Purrward | Home</title>
	<meta name="description" content="Virtual cat care home with proof uploads and Purrpoints." />
</svelte:head>

<form class="home-screen" onsubmit={verifyPhoto}>
	<header class="home-header">
		<div>
			<p>Hello, cat parent</p>
			<h1>Mochi is waiting</h1>
		</div>
		<a class="profile-button" href={resolve('/profile')} aria-label="Open profile and settings">
			<span>{profileInitial}</span>
		</a>
	</header>

	<div class="quick-row" aria-label="Search and settings">
		<div class="search-pill">
			<Search size={22} strokeWidth={2.2} aria-hidden="true" />
			<span>Search care, points, redeem</span>
		</div>
		<button class="filter-button" type="button" aria-label="Open care filters">
			<SlidersHorizontal size={21} strokeWidth={2.2} aria-hidden="true" />
		</button>
	</div>

	<section class="pet-scene" aria-labelledby="scene-title">
		<div class="room-art" aria-hidden="true">
			<svg viewBox="0 0 390 330" role="img">
				<defs>
					<filter id="soften">
						<feGaussianBlur stdDeviation="0.25" />
					</filter>
				</defs>
				<rect class="wash-bg" x="10" y="18" width="370" height="292" rx="34" />
				<path class="floor-line" d="M24 226c88 8 263 7 342-3" />
				<path
					class="window-wash"
					d="M28 72c23-30 67-32 92-8 13 12 14 52 0 70-23 29-73 24-91-6-9-15-11-43-1-56Z"
				/>
				<path class="window-frame" d="M49 67h58v57H49zM78 68v55M50 96h57" />
				<path class="plant-leaf" d="M137 137c-24-23-2-44 9-16" />
				<path class="plant-leaf" d="M149 131c-3-34 28-31 14-2" />
				<path class="plant-leaf" d="M157 145c20-25 41-2 9 10" />
				<path class="plant-stem" d="M150 181c1-20 2-45 1-69" />
				<path class="pot" d="M125 175h54l-7 31h-39z" />
				<path class="frame" d="M286 62h39v47h-39zM305 42l23 20M305 42l-20 20" />
				<path class="frame-paw" d="M305 86c4-9 13-5 10 3-3 8-18 8-20 0-2-7 7-12 10-3Z" />
				<path class="shelf" d="M287 158h72M299 159v54M348 159v54" />
				<path class="book book-a" d="M302 120h12v38h-12z" />
				<path class="book book-b" d="M318 113h12v45h-12z" />
				<path class="book book-c" d="M333 126h12v32h-12z" />
				<path
					class="tiny-plant"
					d="M350 151c-13-18 6-29 9-8M359 151c7-21 27-7 7 6M347 154h25l-4 20h-17z"
				/>
				<path class="rug" d="M82 237c35-35 153-42 221-8 34 17 14 53-90 57-111 4-167-14-131-49Z" />
				<path class="bowl food-bowl" d="M95 248h63c-5 27-57 27-63 0Z" />

				{#if tasks.find((t) => t.id === 'feeding')?.status === 'Done'}
					<path
						class="kibble"
						d="M111 242c9-13 24-9 29 4M119 244c3-12 19-12 23 0M104 250c15-7 37-7 50 0"
					/>
				{/if}

				<path class="bowl water-bowl" d="M292 248h68c-7 27-61 27-68 0Z" />

				{#if tasks.find((t) => t.id === 'water')?.status === 'Done'}
					<path class="water" d="M304 247c11-10 32-10 45 0" />
				{/if}

				<path
					class="toy-ball"
					d="M154 282a12 12 0 1 0 0-24 12 12 0 0 0 0 24ZM147 263c7 4 14 10 18 17M165 263c-9 3-16 9-22 17"
				/>
				<path
					class="mouse-toy"
					d="M199 272c18-24 52-9 45 14-22 9-40 1-45-14ZM244 281c15-8 22-2 26 5"
				/>
				<path class="mouse-ear" d="M211 260c-3-12 9-14 12-4" />
				<path
					class="cat-body patch"
					d="M209 149c-36-9-69 15-74 56-4 38 18 73 59 75 47 3 76-30 69-78-4-27-23-46-54-53Z"
				/>
				<path class="cat-tail" d="M256 217c35 1 42 54 0 56-23 1-29-17-13-28 14-10 26 4 16 15" />
				<path class="cat-head" d="M150 133c0-46 96-46 96 0 0 40-20 62-48 62s-48-22-48-62Z" />
				<path class="cat-ear" d="M162 105 151 62l33 30M234 105l12-43-34 30" />
				<path class="ear-inner" d="M162 91 157 74l14 12M233 91l6-17-15 12" />

				{#if completedCount === totalTasks}
					<!-- Happy closed eyes -->
					<path
						class="cat-eye-happy"
						d="M176 130c2 2 8 2 10 0"
						stroke="#695841"
						stroke-width="2.4"
						stroke-linecap="round"
						fill="none"
					/>
					<path
						class="cat-eye-happy"
						d="M210 130c2 2 8 2 10 0"
						stroke="#695841"
						stroke-width="2.4"
						stroke-linecap="round"
						fill="none"
					/>
				{:else}
					<!-- Open eyes -->
					<circle class="cat-eye" cx="181" cy="130" r="4" />
					<circle class="cat-eye" cx="215" cy="130" r="4" />
				{/if}

				<path
					class="cat-face"
					d="M198 138v8M189 151c6 6 13 6 19 0M171 143l-28-5M173 153l-29 4M224 143l28-5M222 153l29 4"
				/>
				<path class="cat-leg" d="M173 198v64M215 198v64M157 263h29M204 263h29" />
				<path class="collar" d="M169 176c17 10 40 11 59 0" />
				<circle class="bell" cx="199" cy="184" r="6" />
				<path class="body-spot" d="M231 201c25 10 22 46-8 47-10-19-8-35 8-47Z" />
			</svg>
		</div>

		<div class="scene-bubble">
			<h2 id="scene-title">
				{bubbleTitle}
			</h2>
			<p>{tasksLeftText}</p>
			<p>{bubbleText}</p>
		</div>
	</section>

	<!-- Main actions (Feed Mochi / Upload proof) -->
	<div class="scene-actions">
		<button class="feed-button" type="button" onclick={() => (selectedTask = 'feeding')}>
			Feed Mochi
		</button>
		<label class="upload-button">
			<span>Upload proof</span>
			<input type="hidden" name="taskType" value={selectedTask} />
			<input
				name="photo"
				type="file"
				accept="image/jpeg,image/png"
				required={Boolean(data.user)}
				disabled={!data.user || verifying}
				onchange={handleFileChange}
			/>
		</label>
	</div>

	{#if selectedFile !== 'No photo chosen' || result}
		<div class="proof-tray">
			<p>{selectedFile}</p>
			{#if data.user}
				<button type="submit" disabled={verifying}>
					{verifying ? `Checking ${selectedTaskLabel}` : 'Check proof'}
				</button>
			{:else}
				<a href={resolve('/auth/google')}>Sign in</a>
			{/if}
			{#if result}
				<strong class:ok={result.verified} class:warn={!result.verified}>
					{result.reason ?? result.error ?? 'Please upload a clearer proof photo.'}
				</strong>
			{/if}
		</div>
	{/if}

	<section class="flow-strip" aria-label="Care to reward flow">
		{#each flowSteps as step, index (step.title)}
			<div class={['flow-step', step.tone]}>
				<span class="flow-icon">
					{#if step.title === 'Care'}
						<Heart size={21} strokeWidth={2.1} aria-hidden="true" />
					{:else if step.title === 'Proof'}
						<Camera size={21} strokeWidth={2.1} aria-hidden="true" />
					{:else if step.title === 'Points'}
						<Star size={21} strokeWidth={2.1} aria-hidden="true" />
					{:else}
						<Gift size={21} strokeWidth={2.1} aria-hidden="true" />
					{/if}
				</span>
				<strong>{step.title}</strong>
				<small>{step.subtitle}</small>
				{#if index < flowSteps.length - 1}
					<span class="flow-line" aria-hidden="true"></span>
				{/if}
			</div>
		{/each}
	</section>

	<section class="care-section" aria-labelledby="care-title">
		<div class="section-heading">
			<h2 id="care-title">Today's care</h2>
			<a href={resolve('/care')}>
				See all <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
			</a>
		</div>

		<div class="care-preview-row">
			{#each tasks as task (task.id)}
				<button
					class={['care-preview-chip', task.tone, selectedTask === task.id && 'selected']}
					type="button"
					onclick={() => (selectedTask = task.id)}
					aria-label="Select {task.name}"
				>
					<span class="preview-icon-wrapper">
						{@render taskIcon(task.id, 20, 2.1)}
						<span class={['status-dot', task.status === 'Done' ? 'done' : 'pending']}></span>
					</span>
					<span class="preview-label">{task.name}</span>
				</button>
			{/each}
		</div>
	</section>

	<a class="reward-card" href={resolve('/rewards')}>
		<span class="reward-icon" aria-hidden="true">
			<Gift size={32} strokeWidth={1.9} />
		</span>
		<span class="reward-copy">
			<strong>Redeem care rewards</strong>
			<small>Use Purrpoints for vet discounts and pet vouchers.</small>
		</span>
		<span class="reward-cta">
			View rewards
			<ChevronRight size={19} strokeWidth={2.3} aria-hidden="true" />
		</span>
	</a>
</form>

<style>
	.home-screen {
		display: grid;
		gap: 20px;
		padding-bottom: 4px;
	}

	.home-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding-top: 6px;
	}

	.home-header p {
		margin: 0 0 4px;
		color: var(--color-muted);
		font-size: 1rem;
		font-weight: 800;
	}

	.home-header h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: clamp(2rem, 9vw, 2.35rem);
		line-height: 1.02;
	}

	.profile-button {
		display: grid;
		width: 56px;
		height: 56px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid rgba(36, 38, 38, 0.08);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		font-size: 1.25rem;
		font-weight: 900;
		text-decoration: none;
		box-shadow: 0 12px 28px rgba(36, 38, 38, 0.08);
	}

	.quick-row {
		display: grid;
		grid-template-columns: 1fr 56px;
		gap: 12px;
	}

	.search-pill,
	.filter-button {
		border: 1px solid rgba(36, 38, 38, 0.08);
		background: var(--color-paper-2);
		box-shadow: 0 10px 30px rgba(36, 38, 38, 0.055);
	}

	.search-pill {
		display: flex;
		min-width: 0;
		height: 56px;
		align-items: center;
		gap: 12px;
		border-radius: var(--radius-pill);
		padding: 0 18px;
		color: var(--color-muted);
		font-size: 1rem;
		font-weight: 650;
	}

	.search-pill span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.filter-button {
		display: grid;
		height: 56px;
		place-items: center;
		border-radius: 50%;
		color: var(--color-charcoal);
		cursor: pointer;
	}

	.pet-scene {
		position: relative;
		display: grid;
		min-height: 398px;
		overflow: hidden;
		border-radius: 34px;
		background:
			radial-gradient(circle at 18% 18%, rgba(169, 217, 232, 0.24), transparent 27%),
			radial-gradient(circle at 76% 24%, rgba(246, 217, 139, 0.24), transparent 30%),
			linear-gradient(180deg, #fffaf0 0%, #fff1df 100%);
		box-shadow: inset 0 0 0 1px rgba(232, 222, 203, 0.62);
	}

	.pet-scene::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.05;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	.room-art {
		position: absolute;
		inset: 0 0 58px;
	}

	.room-art svg {
		width: 100%;
		height: 100%;
	}

	.room-art path,
	.room-art rect,
	.room-art circle {
		fill: none;
		stroke: #695841;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2.1;
		filter: url('#soften');
	}

	.room-art .wash-bg {
		fill: rgba(255, 253, 248, 0.35);
		stroke: none;
	}

	.room-art .window-wash {
		fill: rgba(169, 200, 168, 0.2);
		stroke: none;
	}

	.room-art .rug {
		fill: rgba(244, 191, 168, 0.42);
		stroke: rgba(218, 139, 104, 0.32);
	}

	.room-art .cat-head,
	.room-art .cat-body {
		fill: #fffbf0;
		stroke-width: 2.4;
	}

	.room-art .cat-tail,
	.room-art .body-spot {
		fill: #8d8376;
		stroke: #695841;
	}

	.room-art .cat-ear {
		fill: #fffbf0;
	}

	.room-art .ear-inner {
		fill: rgba(244, 191, 168, 0.72);
		stroke: none;
	}

	.room-art .cat-eye,
	.room-art .bell {
		fill: #242626;
		stroke: none;
	}

	.room-art .bell {
		fill: #f2be4f;
		stroke: #8a651b;
	}

	.room-art .collar {
		stroke: #c66f52;
		stroke-width: 3;
	}

	.room-art .pot,
	.room-art .food-bowl {
		fill: rgba(244, 191, 168, 0.65);
	}

	.room-art .water-bowl,
	.room-art .tiny-plant {
		fill: rgba(169, 200, 168, 0.5);
	}

	.room-art .plant-leaf,
	.room-art .plant-stem {
		fill: rgba(169, 200, 168, 0.44);
		stroke: #879d6d;
	}

	.room-art .book-a {
		fill: rgba(169, 217, 232, 0.42);
	}

	.room-art .book-b {
		fill: rgba(246, 217, 139, 0.52);
	}

	.room-art .book-c {
		fill: rgba(244, 191, 168, 0.42);
	}

	.room-art .toy-ball {
		fill: rgba(244, 191, 168, 0.56);
	}

	.room-art .mouse-toy,
	.room-art .mouse-ear {
		fill: rgba(169, 200, 168, 0.48);
	}

	.scene-bubble {
		position: relative;
		z-index: 1;
		width: max-content;
		max-width: 210px;
		align-self: end;
		margin: 120px 0 0 18px;
		border-radius: 24px;
		background: rgba(255, 253, 248, 0.94);
		padding: 15px 18px;
		box-shadow: 0 16px 34px rgba(36, 38, 38, 0.1);
	}

	.scene-bubble h2 {
		margin: 0 0 6px;
		font-size: 1.16rem;
		line-height: 1.05;
	}

	.scene-bubble p {
		margin: 0 0 6px;
		color: var(--color-charcoal);
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.scene-actions {
		display: grid;
		grid-template-columns: 1.04fr 0.96fr;
		gap: 12px;
		margin-top: 14px;
	}

	.feed-button,
	.upload-button {
		display: inline-flex;
		min-height: 56px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border-radius: var(--radius-pill);
		font-size: 0.98rem;
		font-weight: 900;
		text-decoration: none;
		cursor: pointer;
		box-sizing: border-box;
		transition:
			transform 120ms ease,
			box-shadow 120ms ease;
	}

	.feed-button:hover,
	.upload-button:hover {
		transform: translateY(-1px);
	}

	.feed-button {
		border: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 14px 28px rgba(36, 38, 38, 0.14);
	}

	.upload-button {
		border: 1px solid rgba(36, 38, 38, 0.08);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 10px 24px rgba(36, 38, 38, 0.05);
		position: relative;
	}

	.upload-button input {
		position: absolute;
		pointer-events: none;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.proof-tray {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
		align-items: center;
		margin: -4px 14px 14px;
		border-radius: 24px;
		background: rgba(255, 253, 248, 0.92);
		padding: 10px;
		box-shadow: 0 10px 24px rgba(36, 38, 38, 0.08);
	}

	.proof-tray p {
		min-width: 0;
		overflow: hidden;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.proof-tray button,
	.proof-tray a {
		min-height: 38px;
		border: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 0 14px;
		font-size: 0.78rem;
	}

	.proof-tray button:disabled {
		background: var(--color-muted);
	}

	.proof-tray strong {
		grid-column: 1 / -1;
		border-radius: 16px;
		padding: 8px 10px;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	.proof-tray .ok {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.proof-tray .warn {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.flow-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		padding: 8px 0;
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	.flow-step {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 5px;
		text-align: center;
	}

	.flow-icon {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		border-radius: 50%;
		color: var(--color-charcoal);
	}

	.flow-step.peach .flow-icon {
		background: #ffdccc;
	}

	.flow-step.butter .flow-icon {
		background: #ffe9ae;
	}

	.flow-step.sage .flow-icon {
		background: #d4eccf;
	}

	.flow-step.lavender .flow-icon {
		background: #e4dcff;
	}

	.flow-step strong {
		color: var(--color-ink);
		font-size: 0.9rem;
	}

	.flow-step small {
		color: var(--color-muted);
		font-size: 0.68rem;
		font-weight: 650;
		line-height: 1.15;
	}

	.flow-line {
		position: absolute;
		top: 22px;
		left: calc(50% + 30px);
		width: calc(100% - 28px);
		border-top: 2px dashed rgba(122, 116, 107, 0.22);
	}

	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.section-heading h2 {
		margin: 0;
		font-size: 1.32rem;
	}

	.section-heading a {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		color: var(--color-muted);
		font-size: 0.9rem;
		font-weight: 800;
		text-decoration: none;
	}

	.care-section {
		display: grid;
		gap: 12px;
	}

	.care-preview-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 4px;
		gap: 12px;
	}

	.care-preview-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 0;
		cursor: pointer;
		padding: 0;
	}

	.preview-icon-wrapper {
		position: relative;
		display: grid;
		width: 48px;
		height: 48px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-paper-2);
		border: 1px solid rgba(36, 38, 38, 0.08);
		box-shadow: 0 4px 12px rgba(36, 38, 38, 0.04);
		transition:
			transform 120ms ease,
			border-color 120ms ease,
			box-shadow 120ms ease;
		color: var(--color-charcoal);
	}

	.care-preview-chip:hover .preview-icon-wrapper {
		transform: scale(1.04);
	}

	.care-preview-chip.selected .preview-icon-wrapper {
		border-color: var(--color-charcoal);
		box-shadow: 0 6px 16px rgba(36, 38, 38, 0.1);
		transform: scale(1.06);
	}

	.care-preview-chip.peach .preview-icon-wrapper {
		background: #ffdccc;
	}
	.care-preview-chip.sky .preview-icon-wrapper {
		background: #cceefa;
	}
	.care-preview-chip.lavender .preview-icon-wrapper {
		background: #e4dcff;
	}
	.care-preview-chip.butter .preview-icon-wrapper {
		background: #ffe9ae;
	}
	.care-preview-chip.sage .preview-icon-wrapper {
		background: #d4eccf;
	}

	.status-dot {
		position: absolute;
		top: -1px;
		right: -1px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1.5px solid var(--color-paper-2);
	}

	.status-dot.done {
		background: var(--color-sage);
	}

	.status-dot.pending {
		background: var(--color-peach);
	}

	.preview-label {
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--color-muted);
		transition: color 120ms ease;
	}

	.care-preview-chip.selected .preview-label {
		color: var(--color-charcoal);
		font-weight: 850;
	}

	.reward-card {
		display: grid;
		grid-template-columns: 74px 1fr auto;
		gap: 14px;
		align-items: center;
		overflow: hidden;
		border: 1px solid rgba(232, 135, 93, 0.2);
		border-radius: 26px;
		background:
			radial-gradient(circle at 10% 30%, rgba(244, 191, 168, 0.45), transparent 31%),
			radial-gradient(circle at 95% 0%, rgba(246, 217, 139, 0.42), transparent 30%),
			linear-gradient(135deg, #ffe4d4, #fff7e8 72%);
		padding: 18px 16px;
		color: var(--color-ink);
		text-decoration: none;
		box-shadow: 0 14px 34px rgba(219, 130, 90, 0.12);
	}

	.reward-icon {
		display: grid;
		width: 64px;
		height: 64px;
		place-items: center;
		border-radius: 22px;
		background: rgba(255, 253, 248, 0.74);
		color: #a95836;
	}

	.reward-copy {
		display: grid;
		gap: 4px;
	}

	.reward-copy strong {
		font-family: var(--font-display);
		font-size: 1.1rem;
		line-height: 1.1;
	}

	.reward-copy small {
		color: var(--color-charcoal);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.reward-cta {
		display: inline-flex;
		min-height: 48px;
		align-items: center;
		gap: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		padding: 0 15px;
		font-size: 0.82rem;
		font-weight: 900;
		white-space: nowrap;
	}

	@media (max-width: 390px) {
		.home-screen {
			gap: 18px;
		}

		.pet-scene {
			min-height: 382px;
		}

		.scene-bubble {
			margin-top: 100px;
		}

		.scene-actions {
			gap: 8px;
		}

		.feed-button,
		.upload-button {
			min-height: 48px;
			font-size: 0.9rem;
		}

		.care-preview-row {
			gap: 8px;
		}

		.preview-icon-wrapper {
			width: 42px;
			height: 42px;
		}

		.reward-card {
			grid-template-columns: 58px 1fr;
		}

		.reward-icon {
			width: 54px;
			height: 54px;
			border-radius: 19px;
		}

		.reward-cta {
			grid-column: 1 / -1;
			justify-content: center;
		}
	}
</style>
