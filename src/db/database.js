import Dexie from 'dexie';

/**
 * FilmDot Dexie IndexedDB Database
 * Provides robust offline-first local storage for PWA capabilities:
 * - Shot lists & narrative breakdowns
 * - Base64 canvas drawings (storyboard frames)
 * - On-set progress checklists
 * - Screenplay drafts
 */
export const db = new Dexie('FilmDotDatabase');

// Define database schema and indices
db.version(1).stores({
  // Shot lists table
  shots: '++id, shot_id, scene_number, shot_type, camera_movement, isCompleted, takeNumber, createdAt, updatedAt',

  // Canvas drawings stored as base64 data URLs
  canvasDrawings: '++id, &shotId, dataUrl, moodboardUrl, createdAt, updatedAt',

  // Canvas drawing revision history / safety snapshots
  canvasDrawingSnapshots: '++id, shotId, dataUrl, createdAt',

  // Set progress checklists
  progressChecklists: '++id, shotId, task, category, isDone, completedAt',

  // Screenplay drafts & scene scripts
  screenplays: '++id, title, text, updatedAt',
});

// Version 2 adds imageNodes table for graph moodboard connections
db.version(2).stores({
  imageNodes: '++id, &nodeId, targetShotId, targetScene, title, createdAt',
});

// ── Default On-Set Production Checklist Templates ──
export const DEFAULT_ONSET_CHECKLIST = [
  { task: 'Block actors and establish eye lines', category: 'Directing' },
  { task: 'Set camera height, angle, and lens focal length', category: 'Camera' },
  { task: 'Lock key, fill, and rim lighting with DP', category: 'Lighting' },
  { task: 'Sound check boom/lav levels & room tone', category: 'Audio' },
  { task: 'Check continuity and costume details', category: 'Continuity' },
  { task: 'Slated & sync mark recorded', category: 'Production' },
];

// ────────────────────────────────────────────────────────
// ── Shot Repository Methods
// ────────────────────────────────────────────────────────
export const shotsDB = {
  /**
   * Retrieves all shots sorted by scene and shot order
   */
  async getAllShots() {
    try {
      return await db.shots.toArray();
    } catch (error) {
      console.error('Failed to get shots from IndexedDB:', error);
      return [];
    }
  },

  /**
   * Bulk saves or replaces shot list in local storage
   */
  async saveShots(shotsList) {
    try {
      const now = new Date().toISOString();
      return await db.transaction('rw', db.shots, async () => {
        // Clear old list to avoid duplicates if re-breaking down
        await db.shots.clear();
        const records = shotsList.map((shot, index) => ({
          ...shot,
          order: index + 1,
          takeNumber: shot.takeNumber || 1,
          isCompleted: Boolean(shot.isCompleted),
          notes: shot.notes || '',
          createdAt: shot.createdAt || now,
          updatedAt: now,
        }));
        await db.shots.bulkAdd(records);
        return records;
      });
    } catch (error) {
      console.error('Failed to save shots to IndexedDB:', error);
      throw error;
    }
  },

  /**
   * Updates a single shot record (e.g. notes, takes, wrap status)
   */
  async updateShot(id, changes) {
    try {
      const updatedData = {
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      await db.shots.update(id, updatedData);
      return updatedData;
    } catch (error) {
      console.error(`Failed to update shot #${id}:`, error);
      throw error;
    }
  },

  /**
   * Clears all shots from database
   */
  async clearShots() {
    return await db.shots.clear();
  },
};

// ────────────────────────────────────────────────────────
// ── Canvas Drawing Repository (Base64 Strings)
// ────────────────────────────────────────────────────────
export const canvasDrawingsDB = {
  /**
   * Saves or updates a storyboard frame drawing as a base64 string
   * @param {string} shotId - Unique shot identifier (e.g. "SHOT-001")
   * @param {string} dataUrl - Base64 PNG representation of canvas
   * @param {string|null} moodboardUrl - Optional reference image URL/base64
   */
  async saveDrawing(shotId, dataUrl, moodboardUrl = null) {
    if (!shotId || (!dataUrl && !moodboardUrl)) return null;
    try {
      const now = new Date().toISOString();
      const existing = await db.canvasDrawings.where('shotId').equals(shotId).first();

      // Save a backup snapshot if new canvas stroke data is provided
      if (dataUrl) {
        try {
          await db.canvasDrawingSnapshots.add({
            shotId,
            dataUrl,
            createdAt: now,
          });
          // Keep at most 20 snapshots per shot
          const snapshots = await db.canvasDrawingSnapshots.where('shotId').equals(shotId).toArray();
          if (snapshots.length > 20) {
            const toDelete = snapshots.slice(0, snapshots.length - 20);
            await Promise.all(toDelete.map((s) => db.canvasDrawingSnapshots.delete(s.id)));
          }
        } catch (snapErr) {
          console.warn('Snapshot backup warning:', snapErr);
        }
      }

      if (existing) {
        await db.canvasDrawings.update(existing.id, {
          dataUrl: dataUrl || existing.dataUrl,
          moodboardUrl: moodboardUrl || existing.moodboardUrl,
          updatedAt: now,
        });
        return existing.id;
      } else {
        const id = await db.canvasDrawings.add({
          shotId,
          dataUrl: dataUrl || '',
          moodboardUrl,
          createdAt: now,
          updatedAt: now,
        });
        return id;
      }
    } catch (error) {
      console.error(`Failed to save canvas drawing for shot ${shotId}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves snapshots for a shot
   */
  async getSnapshots(shotId) {
    if (!shotId) return [];
    try {
      return await db.canvasDrawingSnapshots.where('shotId').equals(shotId).reverse().toArray();
    } catch (error) {
      console.error(`Failed to fetch snapshots for shot ${shotId}:`, error);
      return [];
    }
  },

  /**
   * Retrieves base64 canvas drawing for a specific shot
   */
  async getDrawing(shotId) {
    if (!shotId) return null;
    try {
      return await db.canvasDrawings.where('shotId').equals(shotId).first();
    } catch (error) {
      console.error(`Failed to fetch drawing for shot ${shotId}:`, error);
      return null;
    }
  },

  /**
   * Deletes drawing for a specific shot
   */
  async deleteDrawing(shotId) {
    try {
      return await db.canvasDrawings.where('shotId').equals(shotId).delete();
    } catch (error) {
      console.error(`Failed to delete drawing for shot ${shotId}:`, error);
    }
  },

  /**
   * Deletes all canvas drawings
   */
  async deleteAllDrawings() {
    try {
      return await db.canvasDrawings.clear();
    } catch (error) {
      console.error('Failed to clear all drawings:', error);
    }
  },
};

// ────────────────────────────────────────────────────────
// ── Image / Moodboard Nodes Repository
// ────────────────────────────────────────────────────────
export const imageNodesDB = {
  async getAllImageNodes() {
    try {
      if (!db.imageNodes) return [];
      return await db.imageNodes.toArray();
    } catch (e) {
      console.warn('Failed to load image nodes:', e);
      return [];
    }
  },

  async saveImageNode(nodeRecord) {
    try {
      if (!db.imageNodes || !nodeRecord?.nodeId) return;
      const existing = await db.imageNodes.where('nodeId').equals(nodeRecord.nodeId).first();
      if (existing) {
        await db.imageNodes.update(existing.id, nodeRecord);
      } else {
        await db.imageNodes.add({
          ...nodeRecord,
          createdAt: nodeRecord.createdAt || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Failed to save image node:', e);
    }
  },

  async deleteImageNode(nodeId) {
    try {
      if (!db.imageNodes) return;
      await db.imageNodes.where('nodeId').equals(nodeId).delete();
    } catch (e) {
      console.warn('Failed to delete image node:', e);
    }
  },

  async clearAll() {
    try {
      if (db.imageNodes) await db.imageNodes.clear();
    } catch (e) {
      console.warn('Failed to clear image nodes:', e);
    }
  },
};

// ────────────────────────────────────────────────────────
// ── Progress Checklists Repository
// ────────────────────────────────────────────────────────
export const checklistDB = {
  /**
   * Retrieves checklist items, optionally filtered by shotId
   */
  async getChecklist(shotId = null) {
    try {
      if (shotId) {
        return await db.progressChecklists.where('shotId').equals(shotId).toArray();
      }
      return await db.progressChecklists.toArray();
    } catch (error) {
      console.error('Failed to get checklist items:', error);
      return [];
    }
  },

  /**
   * Seeds default checklist items for a shot if none exist
   */
  async initializeShotChecklist(shotId) {
    if (!shotId) return [];
    try {
      const existing = await db.progressChecklists.where('shotId').equals(shotId).count();
      if (existing === 0) {
        const items = DEFAULT_ONSET_CHECKLIST.map((tpl) => ({
          shotId,
          task: tpl.task,
          category: tpl.category,
          isDone: false,
          completedAt: null,
        }));
        await db.progressChecklists.bulkAdd(items);
        return await db.progressChecklists.where('shotId').equals(shotId).toArray();
      }
      return await db.progressChecklists.where('shotId').equals(shotId).toArray();
    } catch (error) {
      console.error(`Failed to initialize checklist for shot ${shotId}:`, error);
      return [];
    }
  },

  /**
   * Toggles completion status of a checklist item
   */
  async toggleItem(id, isDone) {
    try {
      const completedAt = isDone ? new Date().toISOString() : null;
      await db.progressChecklists.update(id, {
        isDone,
        completedAt,
      });
      return { id, isDone, completedAt };
    } catch (error) {
      console.error(`Failed to toggle checklist item #${id}:`, error);
      throw error;
    }
  },

  /**
   * Adds custom task to checklist
   */
  async addItem(shotId, task, category = 'General') {
    try {
      const id = await db.progressChecklists.add({
        shotId,
        task,
        category,
        isDone: false,
        completedAt: null,
      });
      return id;
    } catch (error) {
      console.error('Failed to add checklist item:', error);
      throw error;
    }
  },
};

// ────────────────────────────────────────────────────────
// ── Screenplay Text Repository
// ────────────────────────────────────────────────────────
export const screenplayDB = {
  /**
   * Saves current working screenplay draft
   */
  async saveScreenplay(text, title = 'Current Scene') {
    try {
      const now = new Date().toISOString();
      const existing = await db.screenplays.toCollection().first();
      if (existing) {
        await db.screenplays.update(existing.id, { text, title, updatedAt: now });
        return existing.id;
      } else {
        return await db.screenplays.add({ title, text, updatedAt: now });
      }
    } catch (error) {
      console.error('Failed to save screenplay:', error);
    }
  },

  /**
   * Retrieves the most recent screenplay draft
   */
  async getLatestScreenplay() {
    try {
      const record = await db.screenplays.toCollection().first();
      return record?.text || null;
    } catch (error) {
      console.error('Failed to get screenplay:', error);
      return null;
    }
  },
};

export default db;
