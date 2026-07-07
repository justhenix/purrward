<!-- Rewards store: split care benefits from cosmetic fun finds. -->
<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Check from '@lucide/svelte/icons/check';
	import Fish from '@lucide/svelte/icons/fish';
	import Heart from '@lucide/svelte/icons/heart';
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
		item?: { id?: string; title?: string; kind?: string; desc?: string };
		balance?: number;
		duplicate?: boolean;
		refund?: number;
		error?: string;
	};
	type GachaResult = {
		id: string;
		title: string;
		kind: string;
		slot: Accessory['slot'] | null;
		duplicate: boolean;
		refund: number;
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
	let openingJar = $state(false);
	let oddsOpen = $state(false);
	let gachaResult = $state<GachaResult | null>(null);
	let ownedItemIds = $state<string[]>([]);
	let equippedSlots = $state<EquippedSlots>({ head: null, neck: null, face: null });
	let equippedBackgroundId = $state('bg_home');
	let replacePrompt = $state<ReplacePrompt | null>(null);
	let equipNotice = $state<EquipNotice | null>(null);

	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(balanceOverride ?? (sandboxMode ? 999999 : (data.user?.purrpoints ?? 0)));
	let canOpenJar = $derived(Boolean(data.user) && !openingJar && balance >= data.gachaCost);
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
	let oddsLabel = $derived(`${Math.round(100 / Math.max(data.accessories.length, 1))}% each`);
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

	function applyLocalEquip(slot: EquipSlot, itemId: string | null) {
		if (slot === 'background') {
			equippedBackgroundId = itemId ?? 'bg_home';
			return;
		}
		equippedSlots = { ...equippedSlots, [slot]: itemId };
	}

	async function refreshCatalog() {
		await Promise.all([invalidate('app:rewards'), invalidate('app:cat')]);
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
			await refreshCatalog();
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
			await refreshCatalog();
		} else {
			showMessage(false, cleanError(body.error));
			if (body.error === 'You already own this item.') await refreshCatalog();
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
			await refreshCatalog();
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
			showMessage(false, `Need ${data.gachaCost} pts.`);
			return;
		}

		openingJar = true;
		message = '';
		gachaResult = null;

		const response = await fetch('/api/gacha/pull', { method: 'POST' });
		const body = (await response.json()) as GachaBody;

		if (response.ok && body.item?.id && body.item.title && typeof body.balance === 'number') {
			const accessory = data.accessories.find((item) => item.id === body.item?.id);
			balanceOverride = body.balance;
			markOwned(body.item.id);
			gachaResult = {
				id: body.item.id,
				title: body.item.title,
				kind: body.item.kind ?? 'accessory',
				slot: accessory?.slot ?? null,
				duplicate: body.duplicate === true,
				refund: body.refund ?? 0
			};
			await refreshCatalog();
		} else {
			showMessage(false, cleanError(body.error));
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
	{#if !data.user}
		<button class="action-btn" type="button" disabled>Locked</button>
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

<div class="rewards-page">
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

	{#if !data.user}
		<div class="auth-blocker">
			<p>Sign in to use rewards.</p>
			<a href={resolve('/auth/login')}>Sign in</a>
		</div>
	{/if}

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
						<p>Cosmetics only.</p>
					</div>
					<span>{data.gachaCost} pts</span>
				</div>
				<div class="jar-actions">
					<button class="action-btn primary" type="button" disabled={!canOpenJar} onclick={openJar}>
						{!data.user
							? 'Locked'
							: openingJar
								? 'Opening'
								: balance < data.gachaCost
									? `Need ${data.gachaCost}`
									: 'Open jar'}
					</button>
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
					<span>{data.accessories.length} finds</span>
					<span>{oddsLabel}</span>
					<span>Duplicate +5 pts</span>
				</div>
			{/if}
			{#if gachaResult}
				{@const result = gachaResult}
				<div class="gacha-result" role="status">
					<div>
						<p>{result.duplicate ? 'Duplicate' : 'New'}</p>
						<h3>{result.title}</h3>
						{#if result.duplicate}
							<span>+{result.refund} pts back</span>
						{/if}
					</div>
					{#if result.slot}
						<button
							class="action-btn primary"
							type="button"
							disabled={busy !== null}
							onclick={() => requestEquipById(result.id, result.slot ?? 'head')}
						>
							{busy ? 'Equipping' : 'Equip'}
						</button>
					{/if}
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
							{#if accessory.equipped}
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
						owned={scene.owned || scene.equipped}
						equipped={scene.equipped}
						price={scene.cost}
					>
						{#if scene.equipped}
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
</div>

{#if replacePrompt}
	<button
		type="button"
		class="equip-backdrop"
		aria-label="Cancel replacement"
		onclick={() => (replacePrompt = null)}
	></button>
	<div class="equip-popup" role="dialog" aria-label="Replace accessory">
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
	></button>
	<div class="equip-popup" role="status" aria-live="polite">
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
		display: grid;
		gap: 14px;
		padding-bottom: 8px;
	}

	.balance-card,
	.reward-card,
	.jar-card,
	.cosmetic-card,
	.auth-blocker {
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
	.cosmetic-copy p,
	.gacha-result p {
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

	.history-link,
	.auth-blocker a {
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

	.auth-blocker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-radius: 20px;
		background: var(--color-sky-soft);
		padding: 12px 14px;
	}

	.auth-blocker p {
		margin: 0;
		color: var(--color-ink);
		font-size: 0.9rem;
		font-weight: 800;
	}

	.auth-blocker a {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
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
	.jar-title-row h2,
	.reward-body h2,
	.cosmetic-copy h3,
	.gacha-result h3 {
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
	.cosmetic-copy h3,
	.gacha-result h3 {
		font-size: 0.96rem;
		line-height: 1.18;
	}

	.reward-body span,
	.jar-title-row span,
	.cosmetic-copy span,
	.odds-panel span,
	.gacha-result span {
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

	.odds-panel,
	.gacha-result {
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

	.gacha-result {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border: 1px solid color-mix(in srgb, var(--color-success-text) 22%, var(--color-line));
		border-radius: 18px;
		background: var(--color-success-bg);
		padding: 10px 11px;
	}

	.gacha-result span {
		background: var(--color-paper-2);
		color: var(--color-success-text);
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
		left: 50%;
		bottom: var(--app-safe-bottom);
		z-index: 69;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 72px;
		gap: 10px;
		width: min(calc(100% - 24px), 390px);
		align-items: center;
		transform: translateX(-50%);
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
