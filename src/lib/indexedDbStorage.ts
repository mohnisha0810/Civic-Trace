/**
 * CivicTrace Resilient IndexedDB Persistence Layer
 *
 * Provides hundreds of megabytes of reliable storage for citizen complaint records
 * and compressed evidence photographs, overcoming the 5MB browser localStorage quota.
 */

import { Complaint, AuditLogEntry } from '../types';

const DB_NAME = 'CivicTracePersistence_v5';
const DB_VERSION = 1;

const STORES = {
  COMPLAINTS: 'complaints',
  EVIDENCE: 'evidence_blobs',
  AUDIT: 'audit_logs',
};

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB unavailable or blocked (private browsing mode). Fallback active.');
        resolve(null);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.COMPLAINTS)) {
          db.createObjectStore(STORES.COMPLAINTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.EVIDENCE)) {
          db.createObjectStore(STORES.EVIDENCE, { keyPath: 'complaintId' });
        }
        if (!db.objectStoreNames.contains(STORES.AUDIT)) {
          db.createObjectStore(STORES.AUDIT, { keyPath: 'id' });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

export async function persistComplaintToIndexedDb(complaint: Complaint): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORES.COMPLAINTS, STORES.EVIDENCE], 'readwrite');
      const complaintStore = tx.objectStore(STORES.COMPLAINTS);
      const evidenceStore = tx.objectStore(STORES.EVIDENCE);

      // Save complaint metadata
      complaintStore.put(complaint);

      // Save large evidence photo blob separately for high-speed indexing
      if (complaint.photoUrl) {
        evidenceStore.put({
          complaintId: complaint.id,
          photoUrl: complaint.photoUrl,
          updatedAt: new Date().toISOString(),
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // don't crash caller
    } catch {
      resolve();
    }
  });
}

export async function loadAllComplaintsFromIndexedDb(): Promise<Complaint[]> {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.COMPLAINTS, 'readonly');
      const store = tx.objectStore(STORES.COMPLAINTS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function persistAuditLogToIndexedDb(entry: AuditLogEntry): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.AUDIT, 'readwrite');
      const store = tx.objectStore(STORES.AUDIT);
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
