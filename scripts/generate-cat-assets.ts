// Generates the UI-ready cat asset manifest from the real asset folders.
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { format } from 'prettier';

type LayerKind =
	| 'body'
	| 'expression'
	| 'accessory'
	| 'paint_splash'
	| 'misc'
	| 'fallback'
	| 'unclassified';

type CatAsset = {
	id: string;
	kind: LayerKind;
	pose: 'sit';
	name: string;
	filename: string;
	path: string;
	uiSrcKey: string;
	tags: string[];
	zIndex: number;
};

type CatAssetManifest = {
	version: 1;
	generatedAt: string;
	sourceDir: string;
	supportedPoses: ['sit'];
	layerOrder: ['paint_splash', 'body', 'expression', 'accessory', 'misc'];
	layers: Record<LayerKind, CatAsset[]>;
	defaultVariant: {
		pose: 'sit';
		body: string;
		expression: string;
		accessory: string | null;
		paint_splash: string | null;
		misc: string | null;
	};
};

const SOURCE_DIR = 'src/lib/assets/cats';
const PROJECT_ROOT = process.cwd();
const ASSET_ROOT = resolve(PROJECT_ROOT, SOURCE_DIR);
const OUTPUT_MANIFEST = resolveAssetPath('cat-assets.generated.json');
const OUTPUT_SCHEMA = resolveAssetPath('cat-assets.schema.json');
const SUPPORTED_EXTENSIONS = new Set(['.webp', '.png', '.svg', '.jpg', '.jpeg']);
const LAYER_ORDER = ['paint_splash', 'body', 'expression', 'accessory', 'misc'] as const;
const ALL_LAYER_KINDS = [...LAYER_ORDER, 'fallback', 'unclassified'] as const;
const ALLOW_UNCLASSIFIED = process.argv.includes('--allow-unclassified');

const Z_INDEX: Record<LayerKind, number> = {
	paint_splash: 0,
	body: 20,
	expression: 30,
	accessory: 40,
	misc: 50,
	fallback: 100,
	unclassified: 0
};

function toPosixPath(value: string): string {
	return value.replaceAll('\\', '/');
}

function assertInsideAssetRoot(path: string): string {
	const resolved = resolve(path);
	const assetRelativePath = relative(ASSET_ROOT, resolved);
	if (
		assetRelativePath === '' ||
		(!assetRelativePath.startsWith('..') && !isAbsolute(assetRelativePath))
	) {
		return resolved;
	}
	throw new Error(`refusing asset path outside ${SOURCE_DIR}: ${path}`);
}

function resolveAssetPath(...segments: string[]): string {
	return assertInsideAssetRoot(resolve(ASSET_ROOT, ...segments));
}

function resolveManifestAssetPath(assetPath: string): string {
	const prefix = `${SOURCE_DIR}/`;
	if (!assetPath.startsWith(prefix)) {
		throw new Error(`refusing manifest path outside ${SOURCE_DIR}: ${assetPath}`);
	}
	return resolveAssetPath(assetPath.slice(prefix.length));
}

async function scanImageFiles(dir: string): Promise<string[]> {
	const safeDir = assertInsideAssetRoot(dir);
	const entries = (await readdir(safeDir, { withFileTypes: true })).sort((a, b) =>
		a.name.localeCompare(b.name)
	);
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = resolveAssetPath(relative(ASSET_ROOT, safeDir), entry.name);
		if (entry.isDirectory()) {
			files.push(...(await scanImageFiles(fullPath)));
			continue;
		}
		if (entry.isFile() && SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
			files.push(fullPath);
		}
	}

	return files;
}

function tokenize(value: string): string[] {
	return value
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
}

function includesAny(values: readonly string[], needles: readonly string[]): boolean {
	return values.some((value) => needles.some((needle) => value.includes(needle)));
}

function classify(uiSrcKey: string, baseId: string): LayerKind {
	const segments = uiSrcKey.toLowerCase().split('/');
	const folders = segments.slice(0, -1);
	const tokens = tokenize(`${folders.join('_')}_${baseId}`);

	if (
		includesAny(folders, ['fallback', 'baked']) ||
		tokens.includes('fallback') ||
		tokens.includes('baked')
	) {
		return 'fallback';
	}
	if (folders.includes('cats_types') || folders.includes('body')) return 'body';
	if (folders.includes('expressions') || folders.includes('expression')) return 'expression';
	if (folders.includes('accessories') || folders.includes('accessory')) return 'accessory';
	if (folders.includes('paint_splash') || folders.includes('wc_splash')) return 'paint_splash';
	if (folders.includes('misc') || folders.includes('zzz_guide')) return 'misc';

	if (tokens.includes('sit')) return 'body';
	if (
		includesAny(tokens, [
			'eye',
			'eyes',
			'mood',
			'face',
			'expression',
			'happy',
			'sad',
			'sleep',
			'normal'
		])
	) {
		return 'expression';
	}
	if (
		includesAny(tokens, ['bandana', 'hat', 'crown', 'glasses', 'wear', 'bow', 'scarf', 'collar'])
	) {
		return 'accessory';
	}
	if (includesAny(tokens, ['splash', 'paint', 'watercolor', 'blob', 'splotch']))
		return 'paint_splash';
	if (includesAny(tokens, ['gacha', 'jar', 'polaroid', 'guide'])) return 'misc';

	return 'unclassified';
}

function titleCase(value: string): string {
	return value
		.split('_')
		.filter((part) => part !== 'sit')
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(' ');
}

function tagsFor(baseId: string, kind: LayerKind): string[] {
	const tags = [...new Set([...tokenize(baseId), kind])];
	if (baseId === 'flower_corn') tags.push('possible-typo');
	return tags;
}

function createAsset(fullPath: string): CatAsset {
	const uiSrcKey = toPosixPath(relative(ASSET_ROOT, assertInsideAssetRoot(fullPath)));
	const filename = basename(fullPath);
	const baseId = basename(filename, extname(filename)).toLowerCase();
	const kind = classify(uiSrcKey, baseId);
	const darkExpression = kind === 'expression' && uiSrcKey.startsWith('expressions/dark_cat/');
	const id =
		kind === 'fallback' ? `fallback_${baseId}` : darkExpression ? `dark_${baseId}` : baseId;
	const displayId = darkExpression ? `dark_${baseId}` : baseId;

	return {
		id,
		kind,
		pose: 'sit',
		name: kind === 'fallback' ? `Fallback ${titleCase(baseId)}` : titleCase(displayId),
		filename,
		path: `${SOURCE_DIR}/${uiSrcKey}`,
		uiSrcKey,
		tags: tagsFor(displayId, kind),
		zIndex: Z_INDEX[kind]
	};
}

function emptyLayers(): Record<LayerKind, CatAsset[]> {
	return {
		body: [],
		expression: [],
		accessory: [],
		paint_splash: [],
		misc: [],
		fallback: [],
		unclassified: []
	};
}

function createSchema(): object {
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		title: 'Purrward cat asset manifest',
		type: 'object',
		required: [
			'version',
			'generatedAt',
			'sourceDir',
			'supportedPoses',
			'layerOrder',
			'layers',
			'defaultVariant'
		],
		additionalProperties: false,
		properties: {
			version: { const: 1 },
			generatedAt: { type: 'string', format: 'date-time' },
			sourceDir: { const: SOURCE_DIR },
			supportedPoses: { type: 'array', items: { const: 'sit' }, minItems: 1, maxItems: 1 },
			layerOrder: { type: 'array', items: { enum: LAYER_ORDER }, minItems: 5, maxItems: 5 },
			layers: {
				type: 'object',
				required: ALL_LAYER_KINDS,
				additionalProperties: false,
				properties: Object.fromEntries(ALL_LAYER_KINDS.map((kind) => [kind, { type: 'array' }]))
			},
			defaultVariant: {
				type: 'object',
				required: ['pose', 'body', 'expression', 'accessory', 'paint_splash', 'misc'],
				additionalProperties: false,
				properties: {
					pose: { const: 'sit' },
					body: { type: 'string' },
					expression: { type: 'string' },
					accessory: { type: ['string', 'null'] },
					paint_splash: { type: ['string', 'null'] },
					misc: { type: ['string', 'null'] }
				}
			}
		}
	};
}

function validate(manifest: CatAssetManifest): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();
	const uiSrcKeys = new Set<string>();

	for (const kind of ALL_LAYER_KINDS) {
		for (const asset of manifest.layers[kind]) {
			if (ids.has(asset.id)) errors.push(`duplicate id: ${asset.id}`);
			ids.add(asset.id);
			if (uiSrcKeys.has(asset.uiSrcKey)) errors.push(`duplicate uiSrcKey: ${asset.uiSrcKey}`);
			uiSrcKeys.add(asset.uiSrcKey);
			if (!existsSync(resolveManifestAssetPath(asset.path))) {
				errors.push(`missing path: ${asset.path}`);
			}
			if (asset.kind !== kind)
				errors.push(`asset ${asset.id} is in ${kind} but has kind ${asset.kind}`);
			if (asset.kind === 'body' && asset.pose !== 'sit')
				errors.push(`body ${asset.id} must use sit pose`);
			if (
				asset.kind !== 'fallback' &&
				asset.kind !== 'unclassified' &&
				/(^|\/)(fallback|baked)(\/|$)|fallback|baked/.test(asset.path)
			) {
				errors.push(`dynamic asset cannot include fallback/baked in path: ${asset.path}`);
			}
		}
	}

	if (!ALLOW_UNCLASSIFIED && manifest.layers.unclassified.length > 0) {
		errors.push(
			`unclassified assets: ${manifest.layers.unclassified.map((asset) => asset.path).join(', ')}`
		);
	}
	if (!ids.has(manifest.defaultVariant.body)) {
		errors.push(`default body missing: ${manifest.defaultVariant.body}`);
	}
	if (!ids.has(manifest.defaultVariant.expression)) {
		errors.push(`default expression missing: ${manifest.defaultVariant.expression}`);
	}

	return errors;
}

function sortAssets(assets: CatAsset[]): CatAsset[] {
	return assets.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
}

function manifestFingerprint(manifest: CatAssetManifest): string {
	return JSON.stringify({ ...manifest, generatedAt: '' });
}

async function getStableGeneratedAt(manifest: CatAssetManifest): Promise<string> {
	try {
		const existing = JSON.parse(await readFile(OUTPUT_MANIFEST, 'utf8')) as CatAssetManifest;
		if (
			typeof existing.generatedAt === 'string' &&
			manifestFingerprint(existing) === manifestFingerprint(manifest)
		) {
			return existing.generatedAt;
		}
	} catch {
		// Fresh manifest or unreadable previous output: use a real generation timestamp.
	}

	return new Date().toISOString();
}

async function writeJson(path: string, value: object): Promise<void> {
	const formatted = await format(JSON.stringify(value), {
		parser: 'json',
		printWidth: 100,
		trailingComma: 'none',
		useTabs: true
	});
	await writeFile(assertInsideAssetRoot(path), formatted);
}

async function main(): Promise<void> {
	const layers = emptyLayers();
	const files = await scanImageFiles(ASSET_ROOT);

	for (const file of files) {
		const asset = createAsset(file);
		layers[asset.kind].push(asset);
	}

	for (const kind of ALL_LAYER_KINDS) {
		layers[kind] = sortAssets(layers[kind]);
	}

	const manifest: CatAssetManifest = {
		version: 1,
		generatedAt: new Date().toISOString(),
		sourceDir: SOURCE_DIR,
		supportedPoses: ['sit'],
		layerOrder: [...LAYER_ORDER],
		layers,
		defaultVariant: {
			pose: 'sit',
			body: 'orange_sit',
			expression: 'normal_orange',
			accessory: null,
			paint_splash: null,
			misc: null
		}
	};
	manifest.generatedAt = await getStableGeneratedAt(manifest);

	const errors = validate(manifest);
	if (errors.length > 0) {
		for (const error of errors) console.error(error);
		process.exit(1);
	}

	await mkdir(dirname(OUTPUT_MANIFEST), { recursive: true });
	await writeJson(OUTPUT_MANIFEST, manifest);
	await writeJson(OUTPUT_SCHEMA, createSchema());

	const counts = ALL_LAYER_KINDS.map((kind) => `${kind}: ${manifest.layers[kind].length}`).join(
		', '
	);
	console.log(`scanned ${files.length} files`);
	console.log(counts);
	console.log(`wrote ${toPosixPath(OUTPUT_MANIFEST)} and ${toPosixPath(OUTPUT_SCHEMA)}`);
}

await main();
