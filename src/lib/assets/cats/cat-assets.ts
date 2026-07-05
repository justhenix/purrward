// Exposes generated cat asset layers with Vite-resolved image URLs for rendering.
import generatedManifest from './cat-assets.generated.json';

export type CatPose = 'sit';
export type CatLayerKind =
	| 'paint_splash'
	| 'body'
	| 'expression'
	| 'accessory'
	| 'misc'
	| 'fallback'
	| 'unclassified';

export type DynamicCatLayerKind = Exclude<CatLayerKind, 'fallback' | 'unclassified'>;

export type CatAsset = {
	id: string;
	kind: CatLayerKind;
	pose: CatPose;
	name: string;
	filename: string;
	path: string;
	uiSrcKey: string;
	tags: string[];
	zIndex: number;
};

export type CatVariant = {
	pose: CatPose;
	body: string;
	expression: string;
	accessory: string | null;
	paint_splash: string | null;
	misc: string | null;
};

export type CatRenderLayer = {
	id: string;
	kind: DynamicCatLayerKind;
	src: string;
	alt: string;
	zIndex: number;
};

export type CatAssetManifest = {
	version: 1;
	generatedAt: string;
	sourceDir: 'src/lib/assets/cats';
	supportedPoses: readonly [CatPose];
	layerOrder: readonly ['paint_splash', 'body', 'expression', 'accessory', 'misc'];
	layers: Record<CatLayerKind, CatAsset[]>;
	defaultVariant: CatVariant;
};

const assetModules = import.meta.glob<string>('./**/*.{webp,png,svg,jpg,jpeg}', {
	eager: true,
	query: '?url',
	import: 'default'
});

export const catAssetManifest = generatedManifest as unknown as CatAssetManifest;
export const layerOrder = catAssetManifest.layerOrder;

const allAssets = Object.values(catAssetManifest.layers).flat();
const assetById = new Map(allAssets.map((asset) => [asset.id, asset]));

export function getAssetsByKind(kind: CatLayerKind): readonly CatAsset[] {
	return catAssetManifest.layers[kind];
}

export function getAssetById(id: string): CatAsset | null {
	return assetById.get(id) ?? null;
}

export function resolveCatAssetUrl(uiSrcKey: string): string {
	const src = assetModules[`./${uiSrcKey}`];
	if (!src) throw new Error(`Missing cat asset URL: ${uiSrcKey}`);
	return src;
}

function requireAsset(id: string, kind: DynamicCatLayerKind): CatAsset {
	const asset = getAssetById(id);
	if (!asset) throw new Error(`Unknown cat asset: ${id}`);
	if (asset.kind !== kind) throw new Error(`Cat asset ${id} must be ${kind}`);
	if (kind === 'body' && asset.pose !== 'sit') throw new Error(`Cat body ${id} must use sit pose`);
	return asset;
}

function toRenderLayer(asset: CatAsset): CatRenderLayer {
	if (asset.kind === 'fallback' || asset.kind === 'unclassified') {
		throw new Error(`Cat asset ${asset.id} cannot be used as a dynamic layer`);
	}
	return {
		id: asset.id,
		kind: asset.kind,
		src: resolveCatAssetUrl(asset.uiSrcKey),
		alt: asset.name,
		zIndex: asset.zIndex
	};
}

export function createCatVariant(input: CatVariant): readonly CatRenderLayer[] {
	const stack: CatAsset[] = [];
	const paintSplash = input.paint_splash ? requireAsset(input.paint_splash, 'paint_splash') : null;
	const body = requireAsset(input.body, 'body');
	const expression = requireAsset(input.expression, 'expression');
	const accessory = input.accessory ? requireAsset(input.accessory, 'accessory') : null;
	const misc = input.misc ? requireAsset(input.misc, 'misc') : null;

	if (input.pose !== 'sit') throw new Error(`Unsupported cat pose: ${input.pose}`);
	if (paintSplash) stack.push(paintSplash);
	stack.push(body, expression);
	if (accessory) stack.push(accessory);
	if (misc) stack.push(misc);

	return stack.map(toRenderLayer);
}
