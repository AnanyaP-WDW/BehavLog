import type { AnnotationData, BehaviorDefinition, BehaviorInstance } from '../types';

const DB_NAME = 'MouseAnnotatorDB';
const DB_VERSION = 2;
const VIDEO_STORE = 'videos';
const ANNOTATION_STORE = 'annotations';
const BEHAVIOR_STORE = 'behaviors';

export interface StoredVideo {
  id: string;
  name: string;
  blob: Blob;
  uploadDate: Date;
  duration: number;
  resolution: [number, number];
  thumbnail?: string;
}

export interface StoredAnnotation {
  id: string;
  videoId: string;
  data: AnnotationData;
  lastModified: Date;
}

export interface StoredBehaviors {
  id: string;
  videoId: string;
  behaviors: BehaviorInstance[];
  behaviorDefinitions: BehaviorDefinition[];
  lastModified: Date;
}

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create video store
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          const videoStore = db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
          videoStore.createIndex('name', 'name', { unique: false });
          videoStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        }

        // Create annotation store
        if (!db.objectStoreNames.contains(ANNOTATION_STORE)) {
          const annotationStore = db.createObjectStore(ANNOTATION_STORE, { keyPath: 'id' });
          annotationStore.createIndex('videoId', 'videoId', { unique: false });
          annotationStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains(BEHAVIOR_STORE)) {
          const behaviorStore = db.createObjectStore(BEHAVIOR_STORE, { keyPath: 'id' });
          behaviorStore.createIndex('videoId', 'videoId', { unique: false });
          behaviorStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  async storeVideo(video: Omit<StoredVideo, 'id'>): Promise<string> {
    const db = this.ensureDB();
    const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedVideo: StoredVideo = {
      ...video,
      id,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.add(storedVideo);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async getVideo(id: string): Promise<StoredVideo | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllVideos(): Promise<StoredVideo[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteVideo(id: string): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE, ANNOTATION_STORE, BEHAVIOR_STORE], 'readwrite');
      
      // Delete video
      const videoStore = transaction.objectStore(VIDEO_STORE);
      videoStore.delete(id);

      // Delete associated annotations
      const annotationStore = transaction.objectStore(ANNOTATION_STORE);
      const annotationIndex = annotationStore.index('videoId');
      const annotationRequest = annotationIndex.openCursor(IDBKeyRange.only(id));

      annotationRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      const behaviorStore = transaction.objectStore(BEHAVIOR_STORE);
      const behaviorIndex = behaviorStore.index('videoId');
      const behaviorRequest = behaviorIndex.openCursor(IDBKeyRange.only(id));

      behaviorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async storeAnnotation(annotation: Omit<StoredAnnotation, 'id'>): Promise<string> {
    const db = this.ensureDB();
    const id = `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedAnnotation: StoredAnnotation = {
      ...annotation,
      id,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ANNOTATION_STORE], 'readwrite');
      const store = transaction.objectStore(ANNOTATION_STORE);
      
      // First, try to find existing annotation for this video
      const index = store.index('videoId');
      const findRequest = index.get(annotation.videoId);
      
      findRequest.onsuccess = () => {
        const existing = findRequest.result;
        if (existing) {
          // Update existing annotation
          const updateRequest = store.put({ ...storedAnnotation, id: existing.id });
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve(existing.id);
        } else {
          // Create new annotation
          const addRequest = store.add(storedAnnotation);
          addRequest.onerror = () => reject(addRequest.error);
          addRequest.onsuccess = () => resolve(id);
        }
      };
      
      findRequest.onerror = () => reject(findRequest.error);
    });
  }

  async getAnnotation(videoId: string): Promise<StoredAnnotation | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ANNOTATION_STORE], 'readonly');
      const store = transaction.objectStore(ANNOTATION_STORE);
      const index = store.index('videoId');
      const request = index.get(videoId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async storeBehaviors(behaviors: Omit<StoredBehaviors, 'id'>): Promise<string> {
    const db = this.ensureDB();
    const id = `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const storedBehavior: StoredBehaviors = {
      ...behaviors,
      id,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BEHAVIOR_STORE], 'readwrite');
      const store = transaction.objectStore(BEHAVIOR_STORE);

      const index = store.index('videoId');
      const findRequest = index.get(behaviors.videoId);

      findRequest.onsuccess = () => {
        const existing = findRequest.result;
        if (existing) {
          const updateRequest = store.put({ ...storedBehavior, id: existing.id });
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve(existing.id);
        } else {
          const addRequest = store.add(storedBehavior);
          addRequest.onerror = () => reject(addRequest.error);
          addRequest.onsuccess = () => resolve(id);
        }
      };

      findRequest.onerror = () => reject(findRequest.error);
    });
  }

  async getBehaviors(videoId: string): Promise<StoredBehaviors | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BEHAVIOR_STORE], 'readonly');
      const store = transaction.objectStore(BEHAVIOR_STORE);
      const index = store.index('videoId');
      const request = index.get(videoId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async generateThumbnail(video: HTMLVideoElement): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 320;
      canvas.height = (video.videoHeight / video.videoWidth) * 320;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve('');
      }
    });
  }
}

export const db = new DatabaseManager();