// Local IndexedDB database for queuing offline care proof photo captures.

export interface OfflineProof {
	id?: number;
	userId: string;
	catId: string;
	taskType: string;
	photo: Blob;
	timestamp: number;
}

const DB_NAME = 'purrward-offline-db';
const STORE_NAME = 'proofs-queue';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined' || !window.indexedDB) {
			reject(new Error('IndexedDB is not available.'));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function addOfflineProof(proof: Omit<OfflineProof, 'id'>): Promise<number> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.add(proof);
		request.onsuccess = () => resolve(request.result as number);
		request.onerror = () => reject(request.error);
	});
}

export async function getOfflineProofs(userId: string): Promise<OfflineProof[]> {
	try {
		const db = await getDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();
			request.onsuccess = () =>
				resolve((request.result as OfflineProof[]).filter((proof) => proof.userId === userId));
			request.onerror = () => reject(request.error);
		});
	} catch {
		return [];
	}
}

export async function deleteOfflineProof(id: number): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(id);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}
