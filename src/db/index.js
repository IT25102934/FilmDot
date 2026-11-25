import Dexie from 'dexie';

// ── FilmDot Local Database (IndexedDB via Dexie) ──
export const db = new Dexie('FilmDotDB');

db.version(1).stores({
  // Projects table
  projects: '++id, title, createdAt, updatedAt, status',

  // Scenes within a project
  scenes: '++id, projectId, title, order, status',

  // Shots within a scene (node graph nodes)
  shots: '++id, sceneId, projectId, title, type, order',

  // Shot connections (node graph edges)
  connections: '++id, projectId, sceneId, sourceId, targetId',

  // Storyboard frames (canvas drawings)
  storyboardFrames: '++id, shotId, sceneId, projectId, canvasData, order',

  // Notes and annotations
  notes: '++id, projectId, sceneId, shotId, content, createdAt',

  // Asset references (images, audio, etc.)
  assets: '++id, projectId, name, type, blobData, thumbnailData, createdAt',
});

export default db;
