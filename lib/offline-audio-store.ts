"use client";

const DATABASE_NAME = "sigca-audios-locales";
const STORE_NAME = "audios";
const DATABASE_VERSION = 1;

export type StoredAudio = {
  id: string;
  fieldKey: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
  blob: Blob;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("fieldKey", "fieldKey");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function finishTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function saveAudio(fieldKey: string, file: File) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const audio: StoredAudio = {
    id: crypto.randomUUID(), fieldKey,
    name: file.name || `audio-${new Date().toISOString().replaceAll(":", "-")}.webm`,
    type: file.type, size: file.size, createdAt: Date.now(), blob: file,
  };
  transaction.objectStore(STORE_NAME).put(audio);
  await finishTransaction(transaction);
  database.close();
  return audio;
}

export async function listAudios(fieldKey: string) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).index("fieldKey").getAll(fieldKey);
  const result = await new Promise<StoredAudio[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as StoredAudio[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return result.sort((left, right) => right.createdAt - left.createdAt);
}

export async function deleteAudio(id: string) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await finishTransaction(transaction);
  database.close();
}

