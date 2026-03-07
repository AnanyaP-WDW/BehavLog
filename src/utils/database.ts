import type {
  AnnotationData,
  BehaviorDefinition,
  BehaviorInstance,
  ProjectRecord,
  ProjectSummary,
  StoredVideoRecord,
  VideoAnnotationState,
} from '../types';

const DB_NAME = 'MouseAnnotatorDB';
const DB_VERSION = 3;
const PROJECT_STORE = 'projects';
const VIDEO_STORE = 'videos';
const ANNOTATION_STORE = 'annotations';
const BEHAVIOR_STORE = 'behaviors';

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
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        this.recreateSchema(database);
      };
    }).finally(() => {
      this.initPromise = null;
    });

    return this.initPromise ?? Promise.resolve();
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  private recreateSchema(database: IDBDatabase) {
    for (const storeName of Array.from(database.objectStoreNames)) {
      database.deleteObjectStore(storeName);
    }

    const projectStore = database.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
    projectStore.createIndex('name', 'name', { unique: false });
    projectStore.createIndex('lastModified', 'lastModified', { unique: false });

    const videoStore = database.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
    videoStore.createIndex('name', 'name', { unique: false });
    videoStore.createIndex('projectId', 'projectId', { unique: false });
    videoStore.createIndex('createdAt', 'createdAt', { unique: false });
    videoStore.createIndex('lastModified', 'lastModified', { unique: false });

    const annotationStore = database.createObjectStore(ANNOTATION_STORE, { keyPath: 'id' });
    annotationStore.createIndex('videoId', 'videoId', { unique: false });
    annotationStore.createIndex('lastModified', 'lastModified', { unique: false });

    const behaviorStore = database.createObjectStore(BEHAVIOR_STORE, { keyPath: 'id' });
    behaviorStore.createIndex('videoId', 'videoId', { unique: false });
    behaviorStore.createIndex('lastModified', 'lastModified', { unique: false });
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private createId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private queueProjectTouch(projectStore: IDBObjectStore, projectId: string, lastModified = new Date()) {
    const getRequest = projectStore.get(projectId);
    getRequest.onsuccess = () => {
      const project = getRequest.result as ProjectRecord | undefined;
      if (!project) {
        return;
      }

      projectStore.put({
        ...project,
        lastModified,
      });
    };
  }

  private queueVideoTouch(
    videoStore: IDBObjectStore,
    projectStore: IDBObjectStore,
    videoId: string,
    updates: Partial<Pick<StoredVideoRecord, 'lastModified' | 'annotationState'>>
  ) {
    const getRequest = videoStore.get(videoId);
    getRequest.onsuccess = () => {
      const video = getRequest.result as StoredVideoRecord | undefined;
      if (!video) {
        return;
      }

      const nextVideo: StoredVideoRecord = {
        ...video,
        ...updates,
      };

      videoStore.put(nextVideo);
      this.queueProjectTouch(projectStore, video.projectId, nextVideo.lastModified);
    };
  }

  private deleteLinkedRecordsByVideoId(store: IDBObjectStore, videoId: string) {
    const index = store.index('videoId');
    const request = index.openCursor(IDBKeyRange.only(videoId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  async createProject(name: string): Promise<string> {
    const db = this.ensureDB();
    const now = new Date();
    const project: ProjectRecord = {
      id: this.createId('project'),
      name,
      createdAt: now,
      lastModified: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.add(project);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(project.id);
    });
  }

  async getProject(id: string): Promise<ProjectRecord | null> {
    const db = this.ensureDB();
    const transaction = db.transaction([PROJECT_STORE], 'readonly');
    const store = transaction.objectStore(PROJECT_STORE);
    const request = store.get(id);
    return this.requestToPromise(request).then((result) => result || null);
  }

  async getProjects(): Promise<ProjectSummary[]> {
    const [projects, videos] = await Promise.all([
      this.getAllProjects(),
      this.getAllVideos(),
    ]);

    const countsByProjectId = videos.reduce<Record<string, number>>((acc, video) => {
      acc[video.projectId] = (acc[video.projectId] || 0) + 1;
      return acc;
    }, {});

    return projects.map((project) => ({
      ...project,
      videoCount: countsByProjectId[project.id] || 0,
    }));
  }

  private async getAllProjects(): Promise<ProjectRecord[]> {
    const db = this.ensureDB();
    const transaction = db.transaction([PROJECT_STORE], 'readonly');
    const store = transaction.objectStore(PROJECT_STORE);
    return this.requestToPromise(store.getAll());
  }

  private async getAllVideos(): Promise<StoredVideoRecord[]> {
    const db = this.ensureDB();
    const transaction = db.transaction([VIDEO_STORE], 'readonly');
    const store = transaction.objectStore(VIDEO_STORE);
    return this.requestToPromise(store.getAll());
  }

  async storeVideo(
    projectId: string,
    video: Omit<StoredVideoRecord, 'id' | 'projectId' | 'createdAt' | 'lastModified' | 'annotationState'>
  ): Promise<string> {
    const db = this.ensureDB();
    const now = new Date();
    const storedVideo: StoredVideoRecord = {
      ...video,
      id: this.createId('video'),
      projectId,
      createdAt: now,
      lastModified: now,
      annotationState: 'not_started',
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_STORE, VIDEO_STORE], 'readwrite');
      const projectStore = transaction.objectStore(PROJECT_STORE);
      const videoStore = transaction.objectStore(VIDEO_STORE);
      const request = videoStore.add(storedVideo);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.queueProjectTouch(projectStore, projectId, now);
        resolve(storedVideo.id);
      };
    });
  }

  async getVideo(id: string): Promise<StoredVideoRecord | null> {
    const db = this.ensureDB();

    const transaction = db.transaction([VIDEO_STORE], 'readonly');
    const store = transaction.objectStore(VIDEO_STORE);
    const request = store.get(id);
    return this.requestToPromise(request).then((result) => result || null);
  }

  async getVideosByProject(projectId: string): Promise<StoredVideoRecord[]> {
    const db = this.ensureDB();
    const transaction = db.transaction([VIDEO_STORE], 'readonly');
    const store = transaction.objectStore(VIDEO_STORE);
    const index = store.index('projectId');
    return this.requestToPromise(index.getAll(IDBKeyRange.only(projectId)));
  }

  async deleteVideo(id: string): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [PROJECT_STORE, VIDEO_STORE, ANNOTATION_STORE, BEHAVIOR_STORE],
        'readwrite'
      );
      const projectStore = transaction.objectStore(PROJECT_STORE);
      const videoStore = transaction.objectStore(VIDEO_STORE);
      const existingVideoRequest = videoStore.get(id);

      existingVideoRequest.onsuccess = () => {
        const existingVideo = existingVideoRequest.result as StoredVideoRecord | undefined;
        if (existingVideo) {
          this.queueProjectTouch(projectStore, existingVideo.projectId);
        }
      };

      videoStore.delete(id);
      this.deleteLinkedRecordsByVideoId(transaction.objectStore(ANNOTATION_STORE), id);
      this.deleteLinkedRecordsByVideoId(transaction.objectStore(BEHAVIOR_STORE), id);

      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to delete video'));
      transaction.oncomplete = () => resolve();
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [PROJECT_STORE, VIDEO_STORE, ANNOTATION_STORE, BEHAVIOR_STORE],
        'readwrite'
      );
      const projectStore = transaction.objectStore(PROJECT_STORE);
      const videoStore = transaction.objectStore(VIDEO_STORE);
      const videoIndex = videoStore.index('projectId');
      const videoRequest = videoIndex.openCursor(IDBKeyRange.only(projectId));

      projectStore.delete(projectId);

      videoRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const video = cursor.value as StoredVideoRecord;
          this.deleteLinkedRecordsByVideoId(transaction.objectStore(ANNOTATION_STORE), video.id);
          this.deleteLinkedRecordsByVideoId(transaction.objectStore(BEHAVIOR_STORE), video.id);
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to delete project'));
      transaction.oncomplete = () => resolve();
    });
  }

  async storeAnnotation(annotation: Omit<StoredAnnotation, 'id'>): Promise<string> {
    const db = this.ensureDB();
    const id = this.createId('annotation');
    const storedAnnotation: StoredAnnotation = {
      ...annotation,
      id,
    };
    const annotationState: VideoAnnotationState =
      annotation.data.annotations.length > 0 ? 'in_progress' : 'not_started';

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_STORE, VIDEO_STORE, ANNOTATION_STORE], 'readwrite');
      const projectStore = transaction.objectStore(PROJECT_STORE);
      const videoStore = transaction.objectStore(VIDEO_STORE);
      const store = transaction.objectStore(ANNOTATION_STORE);
      const index = store.index('videoId');
      const findRequest = index.get(annotation.videoId);

      findRequest.onsuccess = () => {
        const existing = findRequest.result;
        if (existing) {
          const updateRequest = store.put({ ...storedAnnotation, id: existing.id });
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => {
            this.queueVideoTouch(videoStore, projectStore, annotation.videoId, {
              lastModified: annotation.lastModified,
              annotationState,
            });
            resolve(existing.id);
          };
        } else {
          const addRequest = store.add(storedAnnotation);
          addRequest.onerror = () => reject(addRequest.error);
          addRequest.onsuccess = () => {
            this.queueVideoTouch(videoStore, projectStore, annotation.videoId, {
              lastModified: annotation.lastModified,
              annotationState,
            });
            resolve(id);
          };
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
    const id = this.createId('behavior');

    const storedBehavior: StoredBehaviors = {
      ...behaviors,
      id,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_STORE, VIDEO_STORE, BEHAVIOR_STORE], 'readwrite');
      const projectStore = transaction.objectStore(PROJECT_STORE);
      const videoStore = transaction.objectStore(VIDEO_STORE);
      const store = transaction.objectStore(BEHAVIOR_STORE);

      const index = store.index('videoId');
      const findRequest = index.get(behaviors.videoId);

      findRequest.onsuccess = () => {
        const existing = findRequest.result;
        if (existing) {
          const updateRequest = store.put({ ...storedBehavior, id: existing.id });
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => {
            this.queueVideoTouch(videoStore, projectStore, behaviors.videoId, {
              lastModified: behaviors.lastModified,
            });
            resolve(existing.id);
          };
        } else {
          const addRequest = store.add(storedBehavior);
          addRequest.onerror = () => reject(addRequest.error);
          addRequest.onsuccess = () => {
            this.queueVideoTouch(videoStore, projectStore, behaviors.videoId, {
              lastModified: behaviors.lastModified,
            });
            resolve(id);
          };
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

  async touchVideo(
    videoId: string,
    updates: Partial<Pick<StoredVideoRecord, 'lastModified' | 'annotationState'>>
  ): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_STORE, VIDEO_STORE], 'readwrite');
      const projectStore = transaction.objectStore(PROJECT_STORE);
      const videoStore = transaction.objectStore(VIDEO_STORE);

      this.queueVideoTouch(videoStore, projectStore, videoId, updates);

      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to update video'));
      transaction.oncomplete = () => resolve();
    });
  }
}

export const db = new DatabaseManager();