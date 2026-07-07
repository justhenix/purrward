<!-- Rewards store: split care benefits from cosmetic fun finds. -->
<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Check from '@lucide/svelte/icons/check';
	import Fish from '@lucide/svelte/icons/fish';
	import Heart from '@lucide/svelte/icons/heart';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Star from '@lucide/svelte/icons/star';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import Ticket from '@lucide/svelte/icons/ticket';
	import { getAssetById, resolveCatAssetUrl } from '$lib/assets/cats/cat-assets';
	import SceneItem from '$lib/components/SceneItem.svelte';
	import bgPark from '$lib/assets/bg/bg_park.webp';
	import bgParkDark from '$lib/assets/bg/bg_park_night.webp';
	import bgRoom from '$lib/assets/bg/bg-room.webp';
	import bgRoomDark from '$lib/assets/bg/bg-room-dark.webp';
	import gachaJar from '$lib/assets/cats/misc/gacha_jar.webp';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Tab = 'care' | 'fun';
	type Category = 'vet' | 'treat' | 'toy' | 'shelter';
	type Reward = (typeof data.rewards)[number];
	type Accessory = (typeof data.accessories)[number];
	type Scene = (typeof data.scenes)[number];
	type EquipSlot = Accessory['slot'] | 'background';
	type AccessorySlot = Accessory['slot'];
	type EquippedSlots = Record<AccessorySlot, string | null>;
	type EquipPreview = { src?: string; sceneStyle?: string; accessoryStyle?: string };
	type GachaStage = 'confirm' | 'opening' | 'result';
	type ReplacePrompt = {
		itemId: string;
		slot: AccessorySlot;
		title: string;
		currentTitle: string;
		preview: EquipPreview;
	};
	type EquipNotice =
		| {
				kind: 'equipped';
				title: string;
				slot: EquipSlot;
				previousId: string | null;
				preview: EquipPreview;
		  }
		| {
				kind: 'unlocked';
				title: string;
				itemId: string;
				slot: EquipSlot;
				preview: EquipPreview;
		  };

	type RedeemBody = {
		reward?: { title: string };
		balance?: number;
		code?: string;
		error?: string;
	};
	type ShopBody = {
		item?: { title?: string };
		balance?: number;
		error?: string;
	};
	type GachaBody = {
		item?: { id?: string; title?: string; kind?: string; desc?: string; tier?: string };
		balance?: number;
		duplicate?: boolean;
		refund?: number;
		error?: string;
	};
	type GachaResult = {
		id: string;
		title: string;
		kind: string;
		slot: EquipSlot | null;
		duplicate: boolean;
		refund: number;
		meta: string;
		preview: EquipPreview;
	};

	const CHIPS: { id: Category | 'all'; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'vet', label: 'Vet' },
		{ id: 'treat', label: 'Food' },
		{ id: 'toy', label: 'Coupons' },
		{ id: 'shelter', label: 'Donate' }
	];

	let tab = $state<Tab>('care');
	let category = $state<Category | 'all'>('all');
	let balanceOverride = $state<number | null>(null);
	let busy = $state<string | null>(null);
	let message = $state('');
	let messageOk = $state(false);
	let jarSheetOpen = $state(false);
	let jarStage = $state<GachaStage>('confirm');
	let jarError = $state('');
	let openingJar = $state(false);
	let oddsOpen = $state(false);
	let gachaResult = $state<GachaResult | null>(null);
	let ownedItemIds = $state<string[]>([]);
	let equippedSlots = $state<EquippedSlots>({ head: null, neck: null, face: null });
	let equippedBackgroundId = $state('bg_home');
	let replacePrompt = $state<ReplacePrompt | null>(null);
	let equipNotice = $state<EquipNotice | null>(null);

	let signedIn = $derived(Boolean(data.user));
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(balanceOverride ?? (sandboxMode ? 999999 : (data.user?.purrpoints ?? 0)));
	let canOpenJar = $derived(signedIn && !openingJar);
	let canPullJar = $derived(signedIn && !openingJar && balance >= data.gachaCost);
	let visibleRewards = $derived(
		category === 'all'
			? data.rewards
			: data.rewards.filter((reward) => reward.category === category)
	);
	let featuredReward = $derived(
		data.rewards.find((reward) => data.featuredIds.includes(reward.id)) ?? null
	);
	let rotationLabel = $derived(
		`Refreshes in ${data.daysUntilRotation} ${data.daysUntilRotation === 1 ? 'day' : 'days'}`
	);
	let visibleAccessories = $derived(
		data.accessories.map((accessory) => ({
			...accessory,
			owned: ownedItemIds.includes(accessory.id),
			equipped: equippedSlots[accessory.slot] === accessory.id
		}))
	);
	let visibleScenes = $derived(
		data.scenes.map((scene) => ({
			...scene,
			owned: ownedItemIds.includes(scene.id),
			equipped: equippedBackgroundId === scene.id
		}))
	);

	$effect(() => {
		const nextSlots: EquippedSlots = { head: null, neck: null, face: null };
		for (const accessory of data.accessories) {
			if (accessory.equipped) nextSlots[accessory.slot] = accessory.id;
		}
		ownedItemIds = [
			...data.accessories.filter((accessory) => accessory.owned).map((accessory) => accessory.id),
			...data.scenes.filter((scene) => scene.owned).map((scene) => scene.id)
		];
		equippedSlots = nextSlots;
		equippedBackgroundId = data.scenes.find((scene) => scene.equipped)?.id ?? 'bg_home';
	});

	function showMessage(ok: boolean, text: string) {
		messageOk = ok;
		message = text;
	}

	function cleanError(error: string | undefined): string {
		if (!error) return 'Try again.';
		if (error === 'Not enough Purrpoints.') return 'Not enough points.';
		if (error === 'You already own this item.') return 'Owned.';
		if (error.includes('Too many')) return 'Try later.';
		if (error.includes('Authentication')) return 'Sign in first.';
		return error;
	}

	function assetUrl(assetId: string): string {
		const asset = getAssetById(assetId);
		return asset ? resolveCatAssetUrl(asset.uiSrcKey) : '';
	}

	function sceneThumbStyle(scene: Scene): string {
		const thumb =
			scene.id === 'bg_park'
				? { light: bgPark, dark: bgParkDark }
				: { light: bgRoom, dark: bgRoomDark };
		const position = scene.id === 'bg_park' ? '50% 58%' : '50% 76%';
		return `--scene-thumb: url(${thumb.light}); --scene-thumb-light: url(${thumb.light}); --scene-thumb-dark: url(${thumb.dark}); --scene-thumb-position: ${position};`;
	}

	function accessoryPreviewStyle(assetId: string): string {
		if (assetId === 'bandana') return '--asset-scale: 2.8; --asset-x: 0%; --asset-y: -1%;';
		if (assetId === 'bucket_hat') return '--asset-scale: 2.25; --asset-x: 3%; --asset-y: 76%;';
		if (assetId === 'flower_corn') return '--asset-scale: 2.45; --asset-x: 3%; --asset-y: 78%;';
		if (assetId === 'nerd_glasses' || assetId === 'sun_glasses') {
			return '--asset-scale: 2.5; --asset-x: 8%; --asset-y: 56%;';
		}
		return '--asset-scale: 2.2; --asset-x: 0%; --asset-y: 0%;';
	}

	function equipKey(slot: EquipSlot, itemId: string | null): string {
		return `equip-${slot}-${itemId ?? 'none'}`;
	}

	function markOwned(itemId: string) {
		if (!ownedItemIds.includes(itemId)) ownedItemIds = [...ownedItemIds, itemId];
	}

	function accessoryPreview(accessory: Accessory): EquipPreview {
		return {
			src: assetUrl(accessory.assetId),
			accessoryStyle: accessoryPreviewStyle(accessory.assetId)
		};
	}

	function scenePreview(scene: Scene): EquipPreview {
		return { sceneStyle: sceneThumbStyle(scene) };
	}

	function itemTitle(itemId: string | null, slot: EquipSlot): string {
		if (!itemId) return slot === 'background' ? 'Room' : 'Item';
		return (
			data.accessories.find((accessory) => accessory.id === itemId)?.title ??
			data.scenes.find((scene) => scene.id === itemId)?.title ??
			'Item'
		);
	}

	function itemPreview(itemId: string | null, slot: EquipSlot): EquipPreview {
		if (!itemId) return {};
		const accessory = data.accessories.find((item) => item.id === itemId);
		if (accessory) return accessoryPreview(accessory);
		const scene = data.scenes.find((item) => item.id === itemId);
		return scene && slot === 'background' ? scenePreview(scene) : {};
	}

	function gachaSlot(itemId: string, kind: string | undefined): EquipSlot | null {
		const accessory = data.accessories.find((item) => item.id === itemId);
		if (accessory) return accessory.slot;
		if (kind === 'background' || data.scenes.some((scene) => scene.id === itemId))
			return 'background';
		return null;
	}

	function titleCase(value: string): string {
		return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`;
	}

	function gachaMeta(itemId: string, kind: string | undefined, tier: string | undefined): string {
		const accessory = data.accessories.find((item) => item.id === itemId);
		if (accessory) return `${titleCase(tier ?? accessory.tier)} accessory`;
		if (kind === 'background' || data.scenes.some((scene) => scene.id === itemId)) return 'Scene';
		return 'Cosmetic';
	}

	function gachaPreview(itemId: string, slot: EquipSlot | null): EquipPreview {
		if (!slot) return {};
		return itemPreview(itemId, slot);
	}

	function resultActionLabel(result: GachaResult): string {
		return result.slot === 'background' ? 'Use' : 'Equip';
	}

	function prefersReducedMotion(): boolean {
		return (
			typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function revealPause(): Promise<void> {
		if (prefersReducedMotion()) return Promise.resolve();
		return new Promise((resolvePause) => setTimeout(resolvePause, 760));
	}

	function cleanJarError(error: string | undefined): string {
		const text = cleanError(error);
		if (text === 'Not enough points.') return 'Not enough points';
		if (text === 'Try again.') return "Couldn't open";
		return text.replace(/\.$/, '');
	}

	function openJarSheet() {
		if (!signedIn || openingJar) return;
		message = '';
		jarError = balance < data.gachaCost ? 'Not enough points' : '';
		gachaResult = null;
		jarStage = 'confirm';
		replacePrompt = null;
		equipNotice = null;
		jarSheetOpen = true;
	}

	function closeJarSheet() {
		if (openingJar) return;
		jarSheetOpen = false;
		jarStage = 'confirm';
		jarError = '';
		gachaResult = null;
	}

	function equipGachaResult(result: GachaResult) {
		if (!result.slot) return;
		jarSheetOpen = false;
		jarStage = 'confirm';
		requestEquipById(result.id, result.slot);
	}

	function applyLocalEquip(slot: EquipSlot, itemId: string | null) {
		if (slot === 'background') {
			equippedBackgroundId = itemId ?? 'bg_home';
			return;
		}
		equippedSlots = { ...equippedSlots, [slot]: itemId };
	}

	async function refreshCatData() {
		await invalidate('app:cat');
	}

	async function redeemReward(rewardId: string) {
		if (!data.user || busy) return;
		busy = `redeem-${rewardId}`;
		message = '';

		const formData = new FormData();
		formData.set('rewardId', rewardId);
		const response = await fetch('/api/rewards/redeem', { method: 'POST', body: formData });
		const body = (await response.json()) as RedeemBody;

		if (response.ok && typeof body.balance === 'number' && body.reward && body.code) {
			balanceOverride = body.balance;
			showMessage(true, `${body.reward.title} redeemed. Code ${body.code}.`);
			await refreshCatData();
		} else {
			showMessage(false, cleanError(body.error));
		}

		busy = null;
	}

	async function buyItem(itemId: string) {
		if (!data.user || busy) return;
		busy = `unlock-${itemId}`;
		message = '';
		equipNotice = null;

		const formData = new FormData();
		formData.set('itemId', itemId);
		const response = await fetch('/api/shop/purchase', { method: 'POST', body: formData });
		const body = (await response.json()) as ShopBody;

		if (response.ok && typeof body.balance === 'number') {
			balanceOverride = body.balance;
			markOwned(itemId);
			const accessory = data.accessories.find((item) => item.id === itemId);
			const scene = data.scenes.find((item) => item.id === itemId);
			const title = body.item?.title ?? accessory?.title ?? scene?.title ?? 'Item';
			if (accessory) {
				equipNotice = {
					kind: 'unlocked',
					title,
					itemId,
					slot: accessory.slot,
					preview: accessoryPreview(accessory)
				};
			} else if (scene) {
				busy = null;
				await equipItem(scene.id, 'background', title, scenePreview(scene));
				return;
			} else {
				showMessage(true, `${title} unlocked.`);
			}
			await refreshCatData();
		} else {
			showMessage(false, cleanError(body.error));
			if (body.error === 'You already own this item.') markOwned(itemId);
		}

		busy = null;
	}

	async function equipItem(
		itemId: string | null,
		slot: EquipSlot,
		title = itemTitle(itemId, slot),
		preview = itemPreview(itemId, slot)
	) {
		if (!data.user || busy) return;
		if (!data.activeCat) {
			showMessage(false, 'Choose a cat.');
			return;
		}
		const apiItemId = slot === 'background' && itemId === 'bg_home' ? null : itemId;
		const previousId = slot === 'background' ? equippedBackgroundId : equippedSlots[slot];
		busy = equipKey(slot, apiItemId);
		message = '';
		equipNotice = null;
		applyLocalEquip(slot, apiItemId);

		const formData = new FormData();
		formData.set('catId', data.activeCat.id);
		formData.set('slot', slot);
		if (apiItemId) formData.set('itemId', apiItemId);

		const response = await fetch('/api/cats/equip', { method: 'POST', body: formData });
		const body = (await response.json()) as { error?: string };

		if (response.ok) {
			if (apiItemId) {
				if (slot === 'background') {
					showMessage(true, 'Equipped');
				} else {
					equipNotice = { kind: 'equipped', title, slot, previousId, preview };
				}
			} else {
				showMessage(true, 'Removed.');
			}
			await refreshCatData();
		} else {
			applyLocalEquip(slot, previousId);
			showMessage(false, cleanError(body.error));
		}

		busy = null;
	}

	function requestEquipAccessory(accessory: Accessory) {
		const currentId = equippedSlots[accessory.slot];
		if (currentId && currentId !== accessory.id) {
			replacePrompt = {
				itemId: accessory.id,
				slot: accessory.slot,
				title: accessory.title,
				currentTitle: itemTitle(currentId, accessory.slot),
				preview: accessoryPreview(accessory)
			};
			return;
		}
		void equipItem(accessory.id, accessory.slot, accessory.title, accessoryPreview(accessory));
	}

	function requestEquipById(itemId: string, slot: EquipSlot) {
		if (slot === 'background') {
			const scene = data.scenes.find((item) => item.id === itemId);
			void equipItem(
				itemId,
				slot,
				scene?.title ?? itemTitle(itemId, slot),
				scene ? scenePreview(scene) : {}
			);
			return;
		}
		const accessory = data.accessories.find((item) => item.id === itemId);
		if (accessory) requestEquipAccessory(accessory);
	}

	function confirmReplacement() {
		const prompt = replacePrompt;
		if (!prompt) return;
		replacePrompt = null;
		void equipItem(prompt.itemId, prompt.slot, prompt.title, prompt.preview);
	}

	function equipUnlocked(notice: EquipNotice) {
		if (notice.kind !== 'unlocked') return;
		equipNotice = null;
		requestEquipById(notice.itemId, notice.slot);
	}

	function undoEquip(notice: EquipNotice) {
		if (notice.kind !== 'equipped') return;
		equipNotice = null;
		void equipItem(
			notice.previousId,
			notice.slot,
			itemTitle(notice.previousId, notice.slot),
			itemPreview(notice.previousId, notice.slot)
		);
	}

	async function openJar() {
		if (!data.user || openingJar) return;
		if (balance < data.gachaCost) {
			jarError = 'Not enough points';
			return;
		}

		openingJar = true;
		jarStage = 'opening';
		jarError = '';
		message = '';
		gachaResult = null;

		try {
			const [response] = await Promise.all([
				fetch('/api/gacha/pull', { method: 'POST' }),
				revealPause()
			]);
			const body = (await response.json()) as GachaBody;

			if (response.ok && body.item?.id && body.item.title && typeof body.balance === 'number') {
				const slot = gachaSlot(body.item.id, body.item.kind);
				balanceOverride = body.balance;
				markOwned(body.item.id);
				gachaResult = {
					id: body.item.id,
					title: body.item.title,
					kind: body.item.kind ?? 'accessory',
					slot,
					duplicate: body.duplicate === true,
					refund: body.refund ?? 0,
					meta: gachaMeta(body.item.id, body.item.kind, body.item.tier),
					preview: gachaPreview(body.item.id, slot)
				};
				jarStage = 'result';
				await refreshCatData();
			} else {
				jarStage = 'confirm';
				jarError = cleanJarError(body.error);
			}
		} catch {
			jarStage = 'confirm';
			jarError = "Couldn't open";
		}

		openingJar = false;
	}
</script>

<svelte:head>
	<title>Purrward Rewards</title>
</svelte:head>

{#snippet categoryIcon(cat: Category, size = 18)}
	{#if cat === 'vet'}
		<Stethoscope {size} strokeWidth={2.2} aria-hidden="true" />
	{:else if cat === 'treat'}
		<Fish {size} strokeWidth={2.2} aria-hidden="true" />
	{:else if cat === 'toy'}
		<Ticket {size} strokeWidth={2.2} aria-hidden="true" />
	{:else}
		<Heart {size} strokeWidth={2.2} aria-hidden="true" />
	{/if}
{/snippet}

{#snippet rewardCta(reward: Reward)}
	{@const key = `redeem-${reward.id}`}
	{#if !signedIn}
		<!-- Signed-out rewards are preview-only; the page overlay owns the CTA. -->
	{:else if balance < reward.cost}
		<button class="action-btn" type="button" disabled>Need {reward.cost}</button>
	{:else}
		<button
			class="action-btn primary"
			type="button"
			disabled={busy !== null}
			onclick={() => redeemReward(reward.id)}
		>
			{busy === key ? 'Redeeming' : 'Redeem'}
		</button>
	{/if}
{/snippet}

{#snippet equipPreview(preview: EquipPreview)}
	<span
		class="equip-preview"
		style={preview.sceneStyle ?? preview.accessoryStyle ?? ''}
		aria-hidden="true"
	>
		{#if preview.src}
			<img src={preview.src} alt="" width="72" height="72" loading="lazy" />
		{/if}
	</span>
{/snippet}

<div class={['rewards-page', !signedIn && 'signed-out']}>
	<header class="balance-card">
		<span class="balance-icon" aria-hidden="true">
			<Star size={18} strokeWidth={2.3} />
		</span>
		<div class="balance-copy">
			<p>Balance</p>
			<strong>{balance} Purrpoints</strong>
		</div>
		<a class="history-link" href={resolve('/rewards/history')}>My coupons</a>
	</header>

	<div class="top-tabs" role="tablist" aria-label="Reward type">
		<button
			type="button"
			role="tab"
			class:active={tab === 'care'}
			aria-selected={tab === 'care'}
			onclick={() => (tab = 'care')}
		>
			Care Rewards
		</button>
		<button
			type="button"
			role="tab"
			class:active={tab === 'fun'}
			aria-selected={tab === 'fun'}
			onclick={() => (tab = 'fun')}
		>
			Fun Finds
		</button>
	</div>

	{#if message}
		<p class={['store-message', messageOk ? 'ok' : 'warn']}>{message}</p>
	{/if}

	{#if tab === 'care'}
		<section class="section-head" aria-labelledby="care-title">
			<div>
				<h1 id="care-title">Care Rewards</h1>
				<p>Useful perks.</p>
			</div>
		</section>

		{#if featuredReward}
			<section class="featured" aria-label="Featured reward this week">
				<div class="featured-copy">
					<span>Featured this week</span>
					<strong>{rotationLabel}</strong>
				</div>
				<article class="reward-card featured-card">
					<span class={['reward-icon', featuredReward.category]}>
						{@render categoryIcon(featuredReward.category, 22)}
					</span>
					<div class="reward-body">
						<h2>{featuredReward.title}</h2>
						<p>{featuredReward.desc}</p>
						<span>{featuredReward.cost} pts</span>
					</div>
					{@render rewardCta(featuredReward)}
				</article>
			</section>
		{/if}

		<div class="chips" role="tablist" aria-label="Care reward categories">
			{#each CHIPS as chip (chip.id)}
				<button
					type="button"
					role="tab"
					class:active={category === chip.id}
					aria-selected={category === chip.id}
					onclick={() => (category = chip.id)}
				>
					{chip.label}
				</button>
			{/each}
		</div>

		<section class="card-list" aria-label="Care reward list">
			{#each visibleRewards as reward (reward.id)}
				<article class="reward-card">
					<span class={['reward-icon', reward.category]}>
						{@render categoryIcon(reward.category)}
					</span>
					<div class="reward-body">
						<h2>{reward.title}</h2>
						<p>{reward.desc}</p>
						<span>{reward.cost} pts</span>
					</div>
					{@render rewardCta(reward)}
				</article>
			{/each}
		</section>
	{:else}
		<section class="section-head" aria-labelledby="fun-title">
			<div>
				<h1 id="fun-title">Fun Finds</h1>
				<p>Cat cosmetics.</p>
			</div>
		</section>

		<section class="jar-card" aria-labelledby="jar-title">
			<img src={gachaJar} alt="" width="86" height="86" loading="lazy" />
			<div class="jar-copy">
				<div class="jar-title-row">
					<div>
						<h2 id="jar-title">Jar of Finds</h2>
						<p>Cat cosmetics.</p>
					</div>
					<span>{data.gachaCost} pts</span>
				</div>
				<div class="jar-actions">
					{#if signedIn}
						<button
							class="action-btn primary"
							type="button"
							disabled={!canOpenJar}
							onclick={openJarSheet}
						>
							Open jar
						</button>
					{/if}
					<button
						class="action-btn quiet"
						type="button"
						aria-expanded={oddsOpen}
						onclick={() => (oddsOpen = !oddsOpen)}
					>
						Odds
					</button>
				</div>
			</div>
			{#if oddsOpen}
				<div class="odds-panel">
					<span>Common {data.gachaOdds.common}%</span>
					<span>Rare {data.gachaOdds.rare}%</span>
					<span>Epic {data.gachaOdds.epic}%</span>
					<span>Cosmetics only.</span>
				</div>
			{/if}
		</section>

		<section class="shop-section" aria-labelledby="accessories-title">
			<div class="shop-title">
				<h2 id="accessories-title">Accessories</h2>
				<p>Dress your cat.</p>
			</div>
			<div class="cosmetic-grid">
				{#each visibleAccessories as accessory (accessory.id)}
					{@const src = assetUrl(accessory.assetId)}
					<article class="cosmetic-card">
						<span
							class="cosmetic-art"
							style={accessoryPreviewStyle(accessory.assetId)}
							aria-hidden="true"
						>
							{#if src}
								<img {src} alt="" width="64" height="64" loading="lazy" />
							{/if}
						</span>
						<div class="cosmetic-copy">
							<h3>{accessory.title}</h3>
							<p>{accessory.cost} pts</p>
							<span>{accessory.slot}</span>
						</div>
						<div class="cosmetic-actions">
							{#if !signedIn}
								<!-- Preview-only while signed out. -->
							{:else if accessory.equipped}
								<button class="action-btn" type="button" disabled>
									<Check size={14} strokeWidth={3} aria-hidden="true" />
									Equipped
								</button>
								<button
									class="mini-btn"
									type="button"
									disabled={busy !== null}
									onclick={() => equipItem(null, accessory.slot)}
								>
									{busy === equipKey(accessory.slot, null) ? 'Removing' : 'Remove'}
								</button>
							{:else if accessory.owned}
								<button
									class="action-btn primary"
									type="button"
									disabled={busy !== null}
									onclick={() => requestEquipAccessory(accessory)}
								>
									{busy === equipKey(accessory.slot, accessory.id) ? 'Equipping' : 'Equip'}
								</button>
							{:else}
								<button
									class="action-btn primary"
									type="button"
									disabled={!data.user || busy !== null}
									onclick={() => buyItem(accessory.id)}
								>
									{busy === `unlock-${accessory.id}` ? 'Unlocking' : 'Unlock'}
								</button>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="shop-section" aria-labelledby="scenes-title">
			<div class="shop-title">
				<h2 id="scenes-title">Scenes</h2>
				<p>Change your room.</p>
			</div>
			<div class="scene-list">
				{#each visibleScenes as scene (scene.id)}
					<SceneItem
						name={scene.title}
						thumbnailStyle={sceneThumbStyle(scene)}
						owned={signedIn && (scene.owned || scene.equipped)}
						equipped={signedIn && scene.equipped}
						price={scene.cost}
					>
						{#if !signedIn}
							<!-- Preview-only while signed out. -->
						{:else if scene.equipped}
							<button class="action-btn" type="button" disabled>Equipped</button>
						{:else if scene.owned}
							<button
								class="action-btn primary"
								type="button"
								disabled={busy !== null}
								onclick={() => equipItem(scene.id, 'background', scene.title, scenePreview(scene))}
							>
								Use
							</button>
						{:else}
							<button
								class="action-btn primary"
								type="button"
								disabled={!data.user || busy !== null}
								onclick={() => buyItem(scene.id)}
							>
								Unlock
							</button>
						{/if}
					</SceneItem>
				{/each}
			</div>
		</section>
	{/if}

	{#if !signedIn}
		<section class="signin-blocker" aria-labelledby="rewards-signin-title">
			<h2 id="rewards-signin-title">Sign in to get rewards</h2>
			<a href={resolve('/auth/login')}>
				<LogIn size={18} strokeWidth={2.4} aria-hidden="true" />
				<span>Sign in</span>
			</a>
		</section>
	{/if}
</div>

{#if jarSheetOpen}
	<button
		type="button"
		class="jar-backdrop"
		aria-label="Close Jar of Finds"
		disabled={openingJar}
		onclick={closeJarSheet}
		transition:fade={{ duration: 180, easing: cubicOut }}
	></button>
	<div
		class="jar-sheet"
		role="dialog"
		aria-modal="true"
		aria-labelledby="jar-modal-title"
		transition:fly={{ y: 24, duration: 220, opacity: 0, easing: cubicOut }}
	>
		{#if jarStage === 'result' && gachaResult}
			{@const result = gachaResult}
			<div class="jar-reveal" role="status" aria-live="polite">
				<p>{result.duplicate ? 'Already owned' : 'You found'}</p>
				{@render equipPreview(result.preview)}
				<h2 id="jar-modal-title">{result.title}</h2>
				<div class="jar-tags">
					{#if result.duplicate}
						<span>+{result.refund} pts back</span>
					{:else}
						<span>New</span>
						<span>{result.meta}</span>
					{/if}
				</div>
				<div class="jar-balance">
					<span>Balance</span>
					<strong>{balance} pts</strong>
				</div>
				<div class="jar-sheet-actions">
					{#if !result.duplicate && result.slot}
						<button
							type="button"
							class="action-btn primary"
							disabled={busy !== null}
							onclick={() => equipGachaResult(result)}
						>
							{busy ? 'Equipping' : resultActionLabel(result)}
						</button>
					{/if}
					<button type="button" class="action-btn quiet" onclick={closeJarSheet}>Done</button>
				</div>
			</div>
		{:else}
			<div class="jar-sheet-head">
				<h2 id="jar-modal-title">Jar of Finds</h2>
				<p>{jarStage === 'opening' ? 'Opening…' : 'Cat cosmetics.'}</p>
			</div>
			<div class="jar-modal-art-wrap">
				<img
					class:opening={jarStage === 'opening'}
					src={gachaJar}
					alt=""
					width="160"
					height="160"
					loading="eager"
				/>
				{#if jarStage === 'opening'}
					<span class="jar-sparkles" aria-hidden="true">
						<span></span>
						<span></span>
						<span></span>
					</span>
				{/if}
			</div>
			<div class="jar-balance">
				<span>{data.gachaCost} pts</span>
				<strong>Balance {balance} pts</strong>
			</div>
			{#if jarError}
				<p class="jar-error">{jarError}</p>
			{/if}
			<div class="jar-sheet-actions">
				<button type="button" class="action-btn primary" disabled={!canPullJar} onclick={openJar}>
					{jarStage === 'opening' ? 'Opening…' : 'Open'}
				</button>
				<button
					type="button"
					class="action-btn quiet"
					disabled={openingJar}
					onclick={closeJarSheet}
				>
					Cancel
				</button>
			</div>
		{/if}
	</div>
{/if}

{#if replacePrompt}
	<button
		type="button"
		class="equip-backdrop"
		aria-label="Cancel replacement"
		onclick={() => (replacePrompt = null)}
		transition:fade={{ duration: 160, easing: cubicOut }}
	></button>
	<div
		class="equip-popup"
		role="dialog"
		aria-label="Replace accessory"
		transition:fly={{ y: 20, duration: 200, opacity: 0, easing: cubicOut }}
	>
		<div class="equip-copy">
			<p>Replace {replacePrompt.slot} item?</p>
			<strong>{replacePrompt.title}</strong>
			<span>{replacePrompt.currentTitle} will be replaced.</span>
		</div>
		{@render equipPreview(replacePrompt.preview)}
		<div class="equip-actions">
			<button type="button" class="action-btn quiet" onclick={() => (replacePrompt = null)}>
				Cancel
			</button>
			<button
				type="button"
				class="action-btn primary"
				disabled={busy !== null}
				onclick={confirmReplacement}
			>
				Equip
			</button>
		</div>
	</div>
{:else if equipNotice}
	<button
		type="button"
		class="equip-backdrop"
		aria-label="Dismiss equip message"
		onclick={() => (equipNotice = null)}
		transition:fade={{ duration: 160, easing: cubicOut }}
	></button>
	<div
		class="equip-popup"
		role="status"
		aria-live="polite"
		transition:fly={{ y: 20, duration: 200, opacity: 0, easing: cubicOut }}
	>
		<div class="equip-copy">
			<p>{equipNotice.kind === 'unlocked' ? 'Unlocked' : 'Equipped'}</p>
			<strong>{equipNotice.title}</strong>
		</div>
		{@render equipPreview(equipNotice.preview)}
		<div class="equip-actions">
			{#if equipNotice.kind === 'unlocked'}
				<button
					type="button"
					class="action-btn primary"
					disabled={busy !== null}
					onclick={() => equipUnlocked(equipNotice as EquipNotice)}
				>
					Equip now
				</button>
				<button type="button" class="action-btn quiet" onclick={() => (equipNotice = null)}>
					Later
				</button>
			{:else}
				<button
					type="button"
					class="action-btn quiet"
					disabled={busy !== null}
					onclick={() => undoEquip(equipNotice as EquipNotice)}
				>
					Undo
				</button>
				<button type="button" class="action-btn primary" onclick={() => (equipNotice = null)}>
					Done
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.rewards-page {
		position: relative;
		display: grid;
		gap: 14px;
		padding-bottom: 8px;
	}

	.rewards-page.signed-out > :not(.signin-blocker) {
		filter: blur(3px);
		opacity: 0.55;
		pointer-events: none;
		user-select: none;
	}

	.balance-card,
	.reward-card,
	.jar-card,
	.cosmetic-card {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		box-shadow: 0 4px 14px color-mix(in srgb, var(--color-charcoal) 4%, transparent);
	}

	.balance-card {
		display: flex;
		align-items: center;
		gap: 12px;
		border-radius: 22px;
		padding: 12px 14px;
	}

	.balance-icon,
	.reward-icon,
	.cosmetic-art {
		display: grid;
		flex: none;
		place-items: center;
	}

	.balance-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.balance-copy {
		flex: 1;
		min-width: 0;
	}

	.balance-copy p,
	.section-head p,
	.shop-title p,
	.reward-body p,
	.jar-copy p,
	.jar-sheet-head p,
	.jar-reveal p,
	.cosmetic-copy p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 750;
		line-height: 1.25;
	}

	.balance-copy strong {
		display: block;
		color: var(--color-ink);
		font-size: 1.16rem;
		font-weight: 850;
		line-height: 1.12;
		overflow-wrap: anywhere;
	}

	.history-link {
		display: inline-flex;
		min-height: 38px;
		align-items: center;
		border-radius: var(--radius-pill);
		padding: 0 14px;
		color: var(--color-charcoal);
		font-size: 0.8rem;
		font-weight: 850;
		text-decoration: none;
	}

	.history-link {
		border: 1px solid var(--color-line);
		background: var(--color-paper);
	}

	.top-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		border-radius: 24px;
		background: var(--color-paper-3);
		padding: 5px;
	}

	.top-tabs button,
	.chips button {
		min-height: 38px;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 850;
		cursor: pointer;
	}

	.top-tabs button.active,
	.chips button.active {
		background: var(--color-paper-2);
		color: var(--color-ink);
		box-shadow: 0 5px 14px color-mix(in srgb, var(--color-charcoal) 7%, transparent);
	}

	.signin-blocker {
		position: fixed;
		top: calc((100svh - var(--app-safe-bottom)) / 2);
		left: 50%;
		z-index: 46;
		display: grid;
		width: min(calc(100vw - 40px), 372px);
		gap: 12px;
		justify-items: center;
		transform: translate(-50%, -50%);
		border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
		border-radius: var(--radius-card);
		background: color-mix(in srgb, var(--color-paper-2) 92%, transparent);
		padding: 22px 18px;
		text-align: center;
		box-shadow: var(--shadow-float);
		backdrop-filter: blur(12px);
		/* Ease the card in (opacity + scale + blur) instead of popping. */
		animation: signin-blocker-in 220ms var(--ease-mobile, ease-out) both;
		will-change: transform, opacity;
	}

	@keyframes signin-blocker-in {
		from {
			opacity: 0;
			transform: translate(-50%, -46%) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	@supports (height: 100dvh) {
		.signin-blocker {
			top: calc((100dvh - var(--app-safe-bottom)) / 2);
		}
	}

	.signin-blocker h2 {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.22rem;
		font-weight: 850;
		line-height: 1.12;
	}

	.signin-blocker a {
		display: inline-flex;
		width: 100%;
		min-height: 42px;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 0.9rem;
		font-weight: 900;
		text-decoration: none;
	}

	.store-message {
		margin: 0;
		border-radius: 16px;
		padding: 10px 12px;
		font-size: 0.82rem;
		font-weight: 800;
		line-height: 1.32;
	}

	.store-message.ok {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.store-message.warn {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.section-head,
	.shop-title {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
	}

	.section-head h1,
	.shop-title h2,
	.jar-sheet h2,
	.jar-title-row h2,
	.reward-body h2,
	.cosmetic-copy h3 {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-weight: 850;
		letter-spacing: 0;
		overflow-wrap: anywhere;
	}

	.section-head h1 {
		font-size: 1.45rem;
		line-height: 1.06;
	}

	.shop-title h2,
	.jar-title-row h2 {
		font-size: 1.05rem;
		line-height: 1.1;
	}

	.featured,
	.card-list,
	.shop-section {
		display: grid;
		gap: 10px;
	}

	.featured {
		border-radius: 24px;
		background: color-mix(in srgb, var(--color-butter) 30%, transparent);
		padding: 11px;
	}

	.featured-copy {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		color: var(--color-muted);
		font-size: 0.75rem;
		font-weight: 850;
	}

	.featured-copy strong {
		color: var(--color-warning-text);
		font-weight: 850;
		white-space: nowrap;
	}

	.chips {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.chips::-webkit-scrollbar {
		display: none;
	}

	.chips button {
		flex: none;
		border: 1px solid var(--color-line);
		padding: 0 13px;
	}

	.reward-card {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		border-radius: 24px;
		padding: 13px 14px;
	}

	.featured-card {
		background: var(--color-paper-2);
	}

	.reward-icon {
		width: 48px;
		height: 48px;
		border-radius: 15px;
		color: var(--color-charcoal);
	}

	.reward-icon.vet {
		background: var(--color-sky-soft);
	}

	.reward-icon.treat {
		background: var(--color-peach-soft);
	}

	.reward-icon.toy {
		background: var(--color-butter);
	}

	.reward-icon.shelter {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.reward-body,
	.cosmetic-copy {
		min-width: 0;
	}

	.reward-body h2,
	.cosmetic-copy h3 {
		font-size: 0.96rem;
		line-height: 1.18;
	}

	.reward-body span,
	.jar-title-row span,
	.cosmetic-copy span,
	.odds-panel span {
		display: inline-flex;
		width: max-content;
		max-width: 100%;
		margin-top: 6px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-butter) 58%, var(--color-paper-2));
		color: var(--color-ink);
		padding: 3px 9px;
		font-size: 0.72rem;
		font-weight: 850;
	}

	.action-btn,
	.mini-btn {
		display: inline-flex;
		min-height: 36px;
		align-items: center;
		justify-content: center;
		gap: 5px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		color: var(--color-muted);
		padding: 0 12px;
		font-size: 0.78rem;
		font-weight: 850;
		white-space: nowrap;
	}

	.action-btn.primary {
		border: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		cursor: pointer;
	}

	.action-btn.quiet,
	.mini-btn {
		background: var(--color-paper);
		color: var(--color-charcoal);
		cursor: pointer;
	}

	.action-btn:disabled,
	.mini-btn:disabled {
		opacity: 0.62;
		cursor: not-allowed;
	}

	.jar-card {
		display: grid;
		grid-template-columns: 86px minmax(0, 1fr);
		gap: 12px;
		align-items: center;
		border-radius: 24px;
		padding: 12px;
	}

	.jar-card > img {
		width: 86px;
		height: 86px;
		border: 1px solid color-mix(in srgb, var(--color-butter) 38%, var(--color-line));
		border-radius: 20px;
		background: color-mix(in srgb, var(--color-butter) 18%, var(--color-paper-2));
		object-fit: contain;
		padding: 5px;
	}

	.jar-copy {
		display: grid;
		gap: 10px;
		min-width: 0;
	}

	.jar-title-row {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: start;
	}

	.jar-actions,
	.cosmetic-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.odds-panel {
		grid-column: 1 / -1;
	}

	.odds-panel {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		border-radius: 18px;
		background: var(--color-paper);
		padding: 9px;
	}

	.odds-panel span {
		margin: 0;
		background: var(--color-paper-2);
		color: var(--color-muted);
	}

	.jar-backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		border: 0;
		background: color-mix(in srgb, var(--color-charcoal) 22%, transparent);
	}

	.jar-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: var(--app-safe-bottom);
		z-index: 71;
		display: grid;
		gap: 13px;
		width: min(calc(100% - 24px), 390px);
		margin-inline: auto;
		max-height: calc(100svh - var(--app-safe-bottom) - 24px);
		overflow: auto;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-float);
	}

	@supports (height: 100dvh) {
		.jar-sheet {
			max-height: calc(100dvh - var(--app-safe-bottom) - 24px);
		}
	}

	.jar-sheet-head,
	.jar-reveal {
		display: grid;
		gap: 10px;
		justify-items: center;
		text-align: center;
	}

	.jar-sheet h2 {
		font-size: 1.3rem;
		line-height: 1.08;
	}

	.jar-modal-art-wrap {
		position: relative;
		display: grid;
		min-height: 168px;
		place-items: center;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-butter) 34%, var(--color-line));
		border-radius: 24px;
		background: color-mix(in srgb, var(--color-butter) 22%, var(--color-paper-2));
	}

	.jar-modal-art-wrap img {
		width: 160px;
		height: 160px;
		object-fit: contain;
		padding: 4px;
	}

	.jar-modal-art-wrap img.opening {
		animation: jar-bounce 760ms var(--ease-bounce) infinite;
	}

	.jar-sparkles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.jar-sparkles span {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-butter);
		animation: jar-spark 760ms ease-in-out infinite;
	}

	.jar-sparkles span:nth-child(1) {
		left: 25%;
		top: 34%;
	}

	.jar-sparkles span:nth-child(2) {
		right: 28%;
		top: 24%;
		animation-delay: 120ms;
	}

	.jar-sparkles span:nth-child(3) {
		right: 22%;
		bottom: 28%;
		background: var(--color-peach);
		animation-delay: 220ms;
	}

	.jar-balance {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border-radius: 18px;
		background: var(--color-paper);
		padding: 10px 12px;
	}

	.jar-balance span {
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 850;
	}

	.jar-balance strong {
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 900;
		overflow-wrap: anywhere;
	}

	.jar-error {
		margin: 0;
		border-radius: 14px;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
		padding: 8px 10px;
		font-size: 0.8rem;
		font-weight: 850;
		text-align: center;
	}

	.jar-tags,
	.jar-sheet-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
	}

	.jar-tags span {
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-butter) 58%, var(--color-paper-2));
		color: var(--color-ink);
		padding: 4px 10px;
		font-size: 0.74rem;
		font-weight: 850;
	}

	.jar-sheet-actions {
		justify-content: flex-end;
	}

	.jar-reveal .equip-preview {
		width: 128px;
		height: 128px;
		border-radius: 26px;
	}

	.jar-reveal .equip-preview img {
		padding: 8px;
	}

	@keyframes jar-bounce {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		35% {
			transform: translateY(-7px) rotate(-2deg);
		}
		68% {
			transform: translateY(2px) rotate(2deg);
		}
	}

	@keyframes jar-spark {
		0%,
		100% {
			opacity: 0;
			transform: scale(0.5);
		}
		50% {
			opacity: 0.85;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.jar-modal-art-wrap img.opening,
		.jar-sparkles span {
			animation: none;
		}
	}

	.cosmetic-grid,
	.scene-list {
		display: grid;
		gap: 9px;
	}

	.cosmetic-card {
		display: grid;
		grid-template-columns: 68px minmax(0, 1fr) auto;
		gap: 10px;
		align-items: center;
		border-radius: 20px;
		padding: 10px;
	}

	.cosmetic-art {
		width: 68px;
		height: 68px;
		overflow: hidden;
		border-radius: 16px;
		background:
			radial-gradient(
				circle at 50% 42%,
				color-mix(in srgb, var(--color-paper-2) 82%, transparent),
				transparent 66%
			),
			var(--color-paper-3);
	}

	.cosmetic-art img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 2px;
		filter: drop-shadow(0 1px 1px color-mix(in srgb, var(--color-charcoal) 18%, transparent));
		transform: translate(var(--asset-x, 0), var(--asset-y, 0)) scale(var(--asset-scale, 1));
		transform-origin: 50% 50%;
	}

	.equip-backdrop {
		position: fixed;
		inset: 0;
		z-index: 68;
		border: 0;
		background: transparent;
	}

	.equip-popup {
		position: fixed;
		left: 0;
		right: 0;
		bottom: var(--app-safe-bottom);
		z-index: 69;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 72px;
		gap: 10px;
		width: min(calc(100% - 24px), 390px);
		margin-inline: auto;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-2);
		padding: 12px;
		box-shadow: var(--shadow-card);
	}

	.equip-copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.equip-copy p,
	.equip-copy span {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 800;
		line-height: 1.25;
	}

	.equip-copy strong {
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 850;
		line-height: 1.1;
		overflow-wrap: anywhere;
	}

	.equip-preview {
		display: grid;
		width: 72px;
		height: 72px;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background:
			radial-gradient(
				circle at 50% 42%,
				color-mix(in srgb, var(--color-paper-2) 82%, transparent),
				transparent 66%
			),
			var(--color-paper-3);
		background-image: var(--scene-thumb-light, var(--scene-thumb, none));
		background-position: var(--scene-thumb-position, 50% 72%);
		background-size: cover;
	}

	:global(:root[data-theme='dark']) .equip-preview {
		background-image: var(--scene-thumb-dark, var(--scene-thumb-light, var(--scene-thumb, none)));
	}

	@media (prefers-color-scheme: dark) {
		:global(:root[data-theme='system']) .equip-preview {
			background-image: var(--scene-thumb-dark, var(--scene-thumb-light, var(--scene-thumb, none)));
		}
	}

	.equip-preview img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
		filter: drop-shadow(0 1px 1px color-mix(in srgb, var(--color-charcoal) 18%, transparent));
		transform: translate(var(--asset-x, 0), var(--asset-y, 0)) scale(var(--asset-scale, 1));
		transform-origin: 50% 50%;
	}

	.equip-actions {
		display: flex;
		grid-column: 1 / -1;
		gap: 8px;
		justify-content: flex-end;
	}

	@media (max-width: 360px) {
		.reward-card,
		.cosmetic-card {
			grid-template-columns: 54px minmax(0, 1fr);
		}

		.cosmetic-art {
			width: 54px;
			height: 54px;
		}

		.reward-card > .action-btn,
		.cosmetic-actions {
			grid-column: 2;
			justify-self: start;
		}
	}
</style>
