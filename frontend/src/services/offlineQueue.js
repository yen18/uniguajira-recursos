// IndexedDB based cache + offline request queue
// Minimal utility: cache list responses (GET) and queue mutations (POST/PUT/PATCH/DELETE)

const DB_NAME = 'app_offline_db';
const DB_VERSION = 1;
const LIST_STORE = 'lists';
const QUEUE_STORE = 'queue';

let dbPromise = null;

function openDB() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('indexeddb_not_supported'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIST_STORE)) db.createObjectStore(LIST_STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function cacheList(key, data) {
  try {
    const db = await openDB();
    const tx = db.transaction(LIST_STORE, 'readwrite');
    tx.objectStore(LIST_STORE).put({ key, data, savedAt: Date.now() });
    return tx.complete;
  } catch (e) { console.warn('cacheList error', e); }
}

async function getCachedList(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(LIST_STORE, 'readonly');
    const rec = await tx.objectStore(LIST_STORE).get(key);
    return rec ? rec.data : null;
  } catch (e) { return null; }
}

async function enqueueRequest({ method, url, body, headers }) {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).add({ method, url, body, headers, createdAt: Date.now(), attempts: 0 });
    return tx.complete;
  } catch (e) { console.warn('enqueueRequest error', e); }
}

async function fetchWithQueue(apiInstance, { method, url, data }) {
  const headers = {}; // Axios will fill by instance
  if (navigator.onLine) {
    try {
      if (method.toUpperCase() === 'GET') {
        const resp = await apiInstance.get(url, { params: data });
        return resp;
      }
      const resp = await apiInstance.request({ method, url, data });
      return resp;
    } catch (e) {
      if (!navigator.onLine) {
        await enqueueRequest({ method, url, body: data, headers });
        return { data: { success: false, queued: true }, offlineQueued: true };
      }
      throw e;
    }
  } else {
    // Offline immediately
    if (method.toUpperCase() === 'GET') {
      const cached = await getCachedList(url);
      if (cached) return { data: { success: true, data: cached, fromCache: true } };
      return { data: { success: false, offline: true, message: 'Sin conexión y sin cache' } };
    }
    await enqueueRequest({ method, url, body: data, headers });
    return { data: { success: false, queued: true }, offlineQueued: true };
  }
}

async function replayQueue(apiInstance) {
  try {
    if (!navigator.onLine) return;
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const all = await new Promise((resolve, reject) => {
      const items = []; const cursorReq = store.openCursor();
      cursorReq.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (cursor) { items.push({ key: cursor.key, value: cursor.value }); cursor.continue(); } else resolve(items); };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
    for (const item of all) {
      const { method, url, body, headers, attempts } = item.value;
      if (attempts >= 5) { store.delete(item.key); continue; }
      try {
        await apiInstance.request({ method, url, data: body, headers });
        store.delete(item.key);
      } catch (e) {
        // Increment attempts
        item.value.attempts = attempts + 1;
        store.put(item.value);
      }
    }
    return tx.complete;
  } catch (e) { console.warn('replayQueue error', e); }
}

function setupQueueProcessor(apiInstance) {
  window.addEventListener('online', () => replayQueue(apiInstance));
  setInterval(() => replayQueue(apiInstance), 30000); // cada 30s
}

export {
  cacheList,
  getCachedList,
  enqueueRequest,
  replayQueue,
  fetchWithQueue,
  setupQueueProcessor
};
