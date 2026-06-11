import { Restaurant, AudioTour } from '../types';

const DB_NAME = 'FoodioOfflineDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('restaurants')) {
        db.createObjectStore('restaurants', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('audioTours')) {
        db.createObjectStore('audioTours', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

export async function saveRestaurants(restaurants: Restaurant[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('restaurants', 'readwrite');
    const store = tx.objectStore('restaurants');
    
    // Clear old records first
    store.clear();
    
    for (const r of restaurants) {
      store.put(r);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save restaurants to IndexedDB', error);
  }
}

export async function getCachedRestaurants(): Promise<Restaurant[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('restaurants', 'readonly');
    const store = tx.objectStore('restaurants');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached restaurants from IndexedDB', error);
    return [];
  }
}

export async function saveAudioTours(tours: AudioTour[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('audioTours', 'readwrite');
    const store = tx.objectStore('audioTours');
    
    store.clear();
    
    for (const t of tours) {
      store.put(t);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save audio tours to IndexedDB', error);
  }
}

export async function getCachedAudioTours(): Promise<AudioTour[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('audioTours', 'readonly');
    const store = tx.objectStore('audioTours');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached audio tours from IndexedDB', error);
    return [];
  }
}

export async function saveLastSyncInfo(info: { timestamp: number }): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    
    store.put({ key: 'lastSync', ...info });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save last sync info to IndexedDB', error);
  }
}
