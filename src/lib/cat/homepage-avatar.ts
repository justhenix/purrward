// Resolves a homepage cat into a safe, layered render stack from separated body/face assets.
import {
	catAssetManifest,
	getAssetById,
	resolveCatAssetUrl,
	type CatAsset
} from '$lib/assets/cats/cat-assets';

export type CatCoat =
	| 'black'
	| 'calico'
	| 'grey'
	| 'orange'
	| 'siamese'
	| 'tabby'
	| 'tuxedo'
	| 'white';
export type CatMood = 'normal' | 'happy' | 'sad' | 'sleepy';
export type CatPose = 'sit' | 'sleep' | 'play' | 'eat' | 'drink' | 'groom' | 'idle';
export type CatEyeColor = 'blue' | 'green' | 'orange';

export type HomepageCatInput = {
	coat: CatCoat;
	mood: CatMood;
	preferredPose?: CatPose;
	accessory?: string | null;
	accessories?: readonly string[];
};

export type HomepageCatLayer = {
	id: string;
	src: string;
	alt: string;
	zIndex: number;
};

export type HomepageCatAvatar = {
	coat: CatCoat;
	pose: CatPose;
	mood: CatMood;
	eyeColor: CatEyeColor;
	renderStack: HomepageCatLayer[];
	warnings: string[];
};

// The coat determines the cat's default eye color; white cats prefer green-eye faces.
export const defaultEyeColorByCoat = {
	white: 'green',
	black: 'orange',
	grey: 'blue',
	orange: 'green',
	tabby: 'green',
	tuxedo: 'green',
	calico: 'green',
	siamese: 'blue'
} as const satisfies Record<CatCoat, CatEyeColor>;

const COATS: readonly CatCoat[] = [
	'black',
	'calico',
	'grey',
	'orange',
	'siamese',
	'tabby',
	'tuxedo',
	'white'
];
const POSES: readonly CatPose[] = ['sit', 'sleep', 'play', 'eat', 'drink', 'groom', 'idle'];
const EYE_COLORS: readonly CatEyeColor[] = ['blue', 'green', 'orange'];

type ParsedBody = { asset: CatAsset; coat: CatCoat; pose: CatPose };
type ParsedFace = { asset: CatAsset; mood: CatMood; eyeColor: CatEyeColor | null };

function parseBodies(): ParsedBody[] {
	const out: ParsedBody[] = [];
	for (const asset of catAssetManifest.layers.body) {
		const coat = asset.tags.find((tag): tag is CatCoat =>
			(COATS as readonly string[]).includes(tag)
		);
		const pose = asset.tags.find((tag): tag is CatPose =>
			(POSES as readonly string[]).includes(tag)
		);
		if (coat && pose) out.push({ asset, coat, pose });
	}
	return out;
}

function parseFaces(): ParsedFace[] {
	const out: ParsedFace[] = [];
	for (const asset of catAssetManifest.layers.expression) {
		const moodTag = asset.tags.find(
			(tag) => tag === 'normal' || tag === 'happy' || tag === 'sad' || tag === 'sleep'
		);
		if (!moodTag) continue;
		const mood: CatMood = moodTag === 'sleep' ? 'sleepy' : moodTag;
		const eyeColor =
			asset.tags.find((tag): tag is CatEyeColor =>
				(EYE_COLORS as readonly string[]).includes(tag)
			) ?? null;
		out.push({ asset, mood, eyeColor });
	}
	return out;
}

const BODIES = parseBodies();
const FACES = parseFaces();

function findBody(coat: CatCoat, pose: CatPose): ParsedBody | null {
	return BODIES.find((body) => body.coat === coat && body.pose === pose) ?? null;
}

// A sleep body must never carry an upright (non-sleepy) face; upright bodies accept any face.
function faceFitsPose(faceMood: CatMood, pose: CatPose): boolean {
	if (pose === 'sleep') return faceMood === 'sleepy';
	return true;
}

function layerFromAsset(asset: CatAsset): HomepageCatLayer {
	return {
		id: asset.id,
		src: resolveCatAssetUrl(asset.uiSrcKey),
		alt: asset.name,
		zIndex: asset.zIndex
	};
}

function chooseFace(
	pose: CatPose,
	desiredMood: CatMood,
	defaultEye: CatEyeColor,
	coat: CatCoat,
	warnings: string[]
): ParsedFace | null {
	const pool = FACES.filter((face) => faceFitsPose(face.mood, pose));

	// 1. default-eye mood
	const defaultEyeMood = pool.find(
		(face) => face.mood === desiredMood && face.eyeColor === defaultEye
	);
	if (defaultEyeMood) return defaultEyeMood;

	// 2. same mood, any eye (covers eyeless happy/sleepy faces)
	const sameMood = pool.find((face) => face.mood === desiredMood);
	if (sameMood) {
		if (sameMood.eyeColor && sameMood.eyeColor !== defaultEye) {
			warnings.push(
				`${desiredMood} ${defaultEye}-eye face unavailable for ${coat}; using ${sameMood.eyeColor}-eye`
			);
		}
		return sameMood;
	}

	warnings.push(`${desiredMood} face unavailable for ${coat}; using normal`);

	// 3. default-eye normal
	const defaultEyeNormal = pool.find(
		(face) => face.mood === 'normal' && face.eyeColor === defaultEye
	);
	if (defaultEyeNormal) return defaultEyeNormal;

	// 4. any safe normal
	const anyNormal = pool.find((face) => face.mood === 'normal');
	if (anyNormal) return anyNormal;

	// 5. generic fallback: any pose-compatible face
	return pool[0] ?? null;
}

/**
 * Resolves a homepage cat avatar into a validated, layered render stack.
 *
 * Picks a safe body pose first (falling back to sit when the requested pose has
 * no asset), then a mood/eye-matched face that is compatible with that pose.
 */
export function resolveHomepageCatAvatar(input: HomepageCatInput): HomepageCatAvatar {
	const warnings: string[] = [];
	const { coat, mood } = input;
	const defaultEye = defaultEyeColorByCoat[coat];

	// 1. Choose a safe body pose. Unknown/unavailable poses fall back to sit.
	const requestedPose = input.preferredPose ?? 'sit';
	let pose = requestedPose;
	let body = findBody(coat, pose);
	if (!body) {
		if (requestedPose === 'sleep') {
			warnings.push(`sleep pose unavailable for ${coat}; using sit sleepy`);
		} else if (requestedPose !== 'sit') {
			warnings.push(`${requestedPose} pose unavailable for ${coat}; using sit ${mood}`);
		}
		pose = 'sit';
		body = findBody(coat, pose);
	}

	// Generic fallback: no separated body at all, use the baked sit pfp on its own.
	if (!body) {
		warnings.push(`no separated body for ${coat}; using fallback pfp`);
		const fallback = getAssetById(`fallback_${coat}_sit`);
		return {
			coat,
			pose,
			mood,
			eyeColor: defaultEye,
			renderStack: fallback ? [layerFromAsset(fallback)] : [],
			warnings
		};
	}

	// 2. A sleep body can only ever show a sleepy face.
	let desiredMood = mood;
	if (pose === 'sleep' && desiredMood !== 'sleepy') {
		warnings.push(`${mood} face invalid on sleep body for ${coat}; using sleepy`);
		desiredMood = 'sleepy';
	}

	// 3. Choose exactly one face layer.
	const face = chooseFace(pose, desiredMood, defaultEye, coat, warnings);

	const renderStack: HomepageCatLayer[] = [layerFromAsset(body.asset)];
	let eyeColor: CatEyeColor = defaultEye;
	if (face) {
		renderStack.push(layerFromAsset(face.asset));
		eyeColor = face.eyeColor ?? defaultEye;
	} else {
		warnings.push(`no compatible face for ${coat} ${pose}`);
	}

	// 4. Optional accessories on top. Full-canvas artist overlays carry their own placement.
	const accessories = [...(input.accessories ?? []), ...(input.accessory ? [input.accessory] : [])];
	for (const accessoryId of [...new Set(accessories)]) {
		if (!accessoryId) continue;
		const accessory = getAssetById(accessoryId);
		if (accessory && accessory.kind === 'accessory') {
			renderStack.push(layerFromAsset(accessory));
		} else {
			warnings.push(`accessory ${accessoryId} unavailable`);
		}
	}

	renderStack.sort((a, b) => a.zIndex - b.zIndex);

	return { coat, pose, mood: desiredMood, eyeColor, renderStack, warnings };
}
