import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Film,
  Sparkles,
  Clapperboard,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  Wifi,
  WifiOff,
  ImagePlus,
  X,
  Link as LinkIcon,
  Trash2,
  Maximize2,
  Minimize2,
  PlusCircle,
  Settings,
} from 'lucide-react';
import ShotNode from './components/nodes/ShotNode';
import ImageNode from './components/nodes/ImageNode';
import SettingsModal from './components/modals/SettingsModal';
import LiveStatsModal from './components/modals/LiveStatsModal';
import { parseScriptLocally } from './services/scriptParser';
import { shotsDB, screenplayDB, canvasDrawingsDB, imageNodesDB, db } from './db/database';

// Register custom node types outside the component to prevent re-renders
const nodeTypes = {
  shotNode: ShotNode,
  imageNode: ImageNode,
};

const DEFAULT_SAMPLE_SCRIPT = `EXT. NEON ALLEYWAY - NIGHT

Heavy rain cascades down flickering neon billboards of cobalt and crimson.
DETECTIVE KALE (40s), trench coat drenched, approaches an illuminated glass phone booth.

KALE
(whispering into comm)
Dispatch, target entered the sublevel. Do not engage until my signal.

He draws his sidearm. High above on the rusted fire escape, a shadowy figure vaults over the railing.

INT. ABANDONED SERVER ROOM - CONTINUOUS

MAYA (20s) frantically jacks a glowing memory drive into a humming neural console.
Red emergency sirens bathe the dust-choked room in rhythmic pulses.

MAYA
Come on... bypass the biometric lock. Five seconds.

The steel blast doors begin to buckle from heavy hydraulic pressure.`;

// Demo fallback shots for instant preview or offline demonstration
const DEMO_FALLBACK_SHOTS = [
  {
    shot_id: 'SHOT-001',
    scene_number: 1,
    shot_type: 'Establishing Wide Shot (EWS)',
    camera_movement: 'Crane / Jib Vertical Arc',
    lens: '24mm Wide Angle (T1.4) — Environmental Context',
    lensType: 'Static (Prime)',
    lighting: 'Cyberpunk Neon (Cobalt blue & hot magenta RGB)',
    lightingTemp: 'Stylized Neon RGB / Duo-Tone',
    description: 'Rain-soaked dystopian alleyway with neon reflections in puddles as Kale walks into frame.',
    characters: ['DETECTIVE KALE'],
  },
  {
    shot_id: 'SHOT-002',
    scene_number: 1,
    shot_type: 'Medium Close-up (MCU)',
    camera_movement: 'Slow Push-in (Dolly In)',
    lens: '50mm Human Perspective (T1.2) — True-to-Eye',
    lensType: 'Static (Prime)',
    lighting: 'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
    lightingTemp: '5600K (Daylight Cool)',
    description: 'Kale speaking into his wrist comm, raindrops dripping off the brim of his hat, breath visible.',
    characters: ['DETECTIVE KALE'],
  },
  {
    shot_id: 'SHOT-003',
    scene_number: 1,
    shot_type: 'Low Angle Hero Shot',
    camera_movement: 'Tilt Up',
    lens: '35mm Narrative Standard (T1.3) — Cinematic Normal',
    lensType: 'Static (Prime)',
    lighting: 'Cyberpunk Neon (Cobalt blue & hot magenta RGB)',
    lightingTemp: 'Stylized Neon RGB / Duo-Tone',
    description: 'Kale draws weapon as shadow figure sprints across rusted fire escape above, silhouette against neon.',
    characters: ['DETECTIVE KALE', 'SHADOW FIGURE'],
  },
  {
    shot_id: 'SHOT-004',
    scene_number: 2,
    shot_type: 'Over-the-Shoulder (OTS)',
    camera_movement: 'Handheld (Organic Shaky)',
    lens: '24-70mm T2.8 Standard Zoom (Conditional)',
    lensType: 'Conditional (Zoom)',
    lighting: 'Practical Lighting Only (Lamps, monitors, candles)',
    lightingTemp: '3200K (Tungsten Warm)',
    description: 'Maya violently typing into glowing holographic terminal while red sirens strobe.',
    characters: ['MAYA'],
  },
  {
    shot_id: 'SHOT-005',
    scene_number: 2,
    shot_type: 'Extreme Close-up (ECU)',
    camera_movement: 'Static (Locked-off / Tripod)',
    lens: '100mm Macro (T2.8) — Extreme Detail',
    lensType: 'Static (Prime)',
    lighting: 'Hard Direct Spotlight (High-contrast beam / interrogation)',
    lightingTemp: '5600K (Daylight Cool)',
    description: 'Data transfer progress bar jumping from 82% to 94% as Maya’s dilated pupil reflects the countdown.',
    characters: ['MAYA'],
  },
];

export default function App() {
  const [scriptText, setScriptText] = useState(DEFAULT_SAMPLE_SCRIPT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Maximize canvas state
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false);

  // Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Live Stats modal state
  const [liveStatsModalOpen, setLiveStatsModalOpen] = useState(false);

  // Manual shot add modal state
  const [manualShotModalOpen, setManualShotModalOpen] = useState(false);
  const [manualShot, setManualShot] = useState({
    shot_type: 'Medium Shot (MS)',
    camera_movement: 'Static (Locked-off / Tripod)',
    lens: '35mm Narrative Standard (T1.3) — Cinematic Normal',
    lensType: 'Static (Prime)',
    lighting: 'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
    lightingTemp: '5600K (Daylight Cool)',
    description: '',
    characters: '',
  });

  // Image Upload & Connect Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { dataUrl, filename }
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState('');
  const [imageTitle, setImageTitle] = useState('Moodboard Reference');
  const imageUploadInputRef = useRef(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Callback passed to ShotNode to update node data & persist to Dexie IndexedDB
  const handleUpdateNodeData = useCallback(
    (nodeId, updatedFields) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                ...updatedFields,
              },
            };
            // Persist changes to Dexie IndexedDB
            if (node.data?.dbId) {
              shotsDB.updateShot(node.data.dbId, updatedFields).catch(console.error);
            }
            return updatedNode;
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Callback to delete a connected image node
  const handleDeleteImageNode = useCallback(
    (nodeIdToDelete) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeIdToDelete));
      setEdges((eds) => eds.filter((e) => e.source !== nodeIdToDelete && e.target !== nodeIdToDelete));
      imageNodesDB.deleteImageNode(nodeIdToDelete).catch(console.error);
    },
    [setNodes, setEdges]
  );

  // Handle dragging node stop - save positions directly to IndexedDB to avoid state loss on reload
  const onNodeDragStop = useCallback((event, node) => {
    if (node.type === 'shotNode' && node.data?.dbId) {
      shotsDB.updateShot(node.data.dbId, { position: node.position }).catch(console.error);
    } else if (node.type === 'imageNode') {
      imageNodesDB
        .saveImageNode({
          nodeId: node.id,
          imageUrl: node.data?.imageUrl,
          title: node.data?.title,
          targetShotId: node.data?.targetShotId,
          targetScene: node.data?.targetScene,
          position: node.position,
        })
        .catch(console.error);
    }
  }, []);

  // Convert array of shot objects into layout-positioned React Flow nodes & edges
  const generateFlowFromShots = useCallback(
    (shotsList) => {
      const nodeSpacingX = 520;
      const nodeSpacingY = 780;
      const columns = 2;

      const generatedNodes = shotsList.map((shot, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);

        const savedPos = shot.position;
        const hasValidPos =
          savedPos &&
          typeof savedPos.x === 'number' &&
          !isNaN(savedPos.x) &&
          typeof savedPos.y === 'number' &&
          !isNaN(savedPos.y);

        return {
          id: `node-${shot.shot_id || index + 1}`,
          type: 'shotNode',
          position: hasValidPos
            ? savedPos
            : {
                x: 80 + col * nodeSpacingX,
                y: 80 + row * nodeSpacingY,
              },
          data: {
            ...shot,
            dbId: shot.id,
            shot_type: shot.shot_type || 'Medium Shot (MS)',
            camera_movement: shot.camera_movement || 'Static (Locked-off / Tripod)',
            lens: shot.lens || '35mm Narrative Standard (T1.3) — Cinematic Normal',
            lensType: shot.lensType || 'Static (Prime)',
            lighting: shot.lighting || 'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
            lightingTemp: shot.lightingTemp || '5600K (Daylight Cool)',
            takeNumber: shot.takeNumber || 1,
            isCompleted: Boolean(shot.isCompleted),
            notes: shot.notes || '',
            onUpdateNodeData: handleUpdateNodeData,
          },
        };
      });

      // Sequential animated edges connecting shots in narrative order
      const generatedEdges = [];
      for (let i = 0; i < generatedNodes.length - 1; i++) {
        generatedEdges.push({
          id: `edge-${generatedNodes[i].id}-${generatedNodes[i + 1].id}`,
          source: generatedNodes[i].id,
          target: generatedNodes[i + 1].id,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        });
      }

      setNodes(generatedNodes);
      setEdges(generatedEdges);
      return generatedNodes;
    },
    [handleUpdateNodeData, setNodes, setEdges]
  );

  // Restore saved image nodes from IndexedDB onto canvas
  const restoreImageNodes = useCallback(
    (imageNodesList, currentShotNodes) => {
      if (!imageNodesList || imageNodesList.length === 0) return;
      const restoredNodes = [];
      const restoredEdges = [];

      for (const item of imageNodesList) {
        const targetNode = currentShotNodes?.find(
          (n) => n.data?.shot_id === item.targetShotId || n.id === item.targetShotId
        );

        restoredNodes.push({
          id: item.nodeId,
          type: 'imageNode',
          position: item.position || { x: 50, y: 100 },
          data: {
            imageUrl: item.imageUrl,
            title: item.title || 'Moodboard Reference',
            targetShotId: item.targetShotId,
            targetScene: item.targetScene,
            onDelete: handleDeleteImageNode,
          },
        });

        if (targetNode) {
          restoredEdges.push({
            id: `edge-${item.nodeId}-${targetNode.id}`,
            source: item.nodeId,
            target: targetNode.id,
            animated: true,
            style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '4,4' },
          });
        }
      }

      setNodes((nds) => [...nds, ...restoredNodes]);
      setEdges((eds) => [...eds, ...restoredEdges]);
    },
    [handleDeleteImageNode, setNodes, setEdges]
  );

  // Load persisted shots & screenplay draft from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;

    async function loadOfflineData() {
      try {
        const [persistedShots, savedScreenplay, persistedImageNodes] = await Promise.all([
          shotsDB.getAllShots(),
          screenplayDB.getLatestScreenplay(),
          imageNodesDB.getAllImageNodes(),
        ]);

        if (!isMounted) return;

        if (savedScreenplay) {
          setScriptText(savedScreenplay);
        }

        let loadedShotNodes = [];
        if (persistedShots && persistedShots.length > 0) {
          loadedShotNodes = generateFlowFromShots(persistedShots);
        } else {
          // Initialize with demo fallback shots and save to IndexedDB
          const saved = await shotsDB.saveShots(DEMO_FALLBACK_SHOTS);
          if (isMounted) loadedShotNodes = generateFlowFromShots(saved);
        }

        if (isMounted && persistedImageNodes && persistedImageNodes.length > 0) {
          restoreImageNodes(persistedImageNodes, loadedShotNodes);
        }
      } catch (err) {
        console.warn('Could not load from IndexedDB, using fallback demo:', err);
        if (isMounted) generateFlowFromShots(DEMO_FALLBACK_SHOTS);
      }
    }

    loadOfflineData();

    return () => {
      isMounted = false;
    };
  }, [generateFlowFromShots, restoreImageNodes]);

  // Handle Break Down Script (local parser — no API call)
  const handleBreakdown = async () => {
    if (!scriptText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsedShots = parseScriptLocally(scriptText);
      if (parsedShots && parsedShots.length > 0) {
        // Persist shots and screenplay to IndexedDB for offline access
        const savedRecords = await shotsDB.saveShots(parsedShots);
        await screenplayDB.saveScreenplay(scriptText);
        generateFlowFromShots(savedRecords);
        window.umami?.track('script_parsed', { shotCount: parsedShots.length });
      } else {
        throw new Error('No shots could be extracted from the screenplay text.');
      }
    } catch (err) {
      console.error('Script breakdown failed:', err);
      setError(err.message || 'Failed to parse screenplay.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Image File Selected from Sidebar Upload Button
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setPendingImage({ dataUrl, filename: file.name });
        setImageTitle(file.name.replace(/\.[^/.]+$/, ''));

        // Default to first available shot node
        const shotNodes = nodes.filter((n) => n.type === 'shotNode');
        if (shotNodes.length > 0) {
          setSelectedTargetNodeId(shotNodes[0].id);
        }
        setUploadModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Connect Uploaded Image to Target Scene/Shot Node
  const handleConnectImageToNode = () => {
    if (!pendingImage || !selectedTargetNodeId) return;

    const targetNode = nodes.find((n) => n.id === selectedTargetNodeId);
    if (!targetNode) return;

    const newImageNodeId = `img-node-${Date.now()}`;
    const newImagePos = {
      x: targetNode.position.x - 330,
      y: targetNode.position.y + 30,
    };

    const newImageNode = {
      id: newImageNodeId,
      type: 'imageNode',
      position: newImagePos,
      data: {
        imageUrl: pendingImage.dataUrl,
        title: imageTitle || 'Moodboard Reference',
        targetShotId: targetNode.data?.shot_id,
        targetScene: targetNode.data?.scene_number,
        onDelete: handleDeleteImageNode,
      },
    };

    const newConnectionEdge = {
      id: `edge-${newImageNodeId}-${selectedTargetNodeId}`,
      source: newImageNodeId,
      target: selectedTargetNodeId,
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '4,4' },
    };

    setNodes((nds) => [...nds, newImageNode]);
    setEdges((eds) => [...eds, newConnectionEdge]);

    // Persist to imageNodes in IndexedDB
    imageNodesDB
      .saveImageNode({
        nodeId: newImageNodeId,
        imageUrl: pendingImage.dataUrl,
        title: imageTitle || 'Moodboard Reference',
        targetShotId: targetNode.data?.shot_id,
        targetScene: targetNode.data?.scene_number,
        position: newImagePos,
      })
      .catch(console.error);

    // Also persist reference drawing in IndexedDB for that shot
    if (targetNode.data?.shot_id) {
      canvasDrawingsDB.saveDrawing(targetNode.data.shot_id, null, pendingImage.dataUrl).catch(console.error);
    }

    setUploadModalOpen(false);
    setPendingImage(null);
  };

  // Load demo shots directly and persist
  const handleLoadDemo = async () => {
    setError(null);
    const saved = await shotsDB.saveShots(DEMO_FALLBACK_SHOTS);
    generateFlowFromShots(saved);
  };

  // Clear entire workspace: wipe nodes, edges, and all IndexedDB data for a fresh start
  const handleClearWorkspace = async () => {
    const confirmed = window.confirm(
      'Clear entire workspace?\n\nThis will remove all shots, canvas drawings, checklists, and screenplay data. You cannot undo this.'
    );
    if (!confirmed) return;

    try {
      await shotsDB.clearShots();
      if (canvasDrawingsDB.deleteAllDrawings) {
        await canvasDrawingsDB.deleteAllDrawings();
      } else if (db.canvasDrawings) {
        await db.canvasDrawings.clear();
      }
      await imageNodesDB.clearAll();
      await db.progressChecklists?.clear();
      await db.screenplays?.clear();
    } catch (err) {
      console.warn('Error clearing some DB tables:', err);
    }

    setNodes([]);
    setEdges([]);
    setScriptText('');
    setError(null);
  };

  // Add a single shot manually (when API is offline)
  const handleAddManualShot = async () => {
    const shotIndex = nodes.filter((n) => n.type === 'shotNode').length;
    const newShot = {
      shot_id: `SHOT-${String(shotIndex + 1).padStart(3, '0')}`,
      scene_number: 1,
      shot_type: manualShot.shot_type,
      camera_movement: manualShot.camera_movement,
      lens: manualShot.lens,
      lensType: manualShot.lensType,
      lighting: manualShot.lighting,
      lightingTemp: manualShot.lightingTemp,
      description: manualShot.description || 'New shot',
      characters: manualShot.characters
        ? manualShot.characters.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
    };

    try {
      // Get all existing shots, append new one, save all
      const existingShots = await shotsDB.getAllShots();
      const allShots = [...existingShots, newShot];
      const saved = await shotsDB.saveShots(allShots);
      generateFlowFromShots(saved);
      window.umami?.track('shot_created', { shotId: newShot.shot_id });
    } catch (err) {
      console.error('Failed to add manual shot:', err);
      // Fallback: just add to canvas without DB
      const columns = 2;
      const col = shotIndex % columns;
      const row = Math.floor(shotIndex / columns);
      const newNode = {
        id: `node-${newShot.shot_id}`,
        type: 'shotNode',
        position: { x: 80 + col * 520, y: 80 + row * 780 },
        data: { ...newShot, onUpdateNodeData: handleUpdateNodeData },
      };
      setNodes((nds) => [...nds, newNode]);
    }

    setManualShotModalOpen(false);
    setManualShot({
      shot_type: 'Medium Shot (MS)',
      camera_movement: 'Static (Locked-off / Tripod)',
      lens: '35mm Narrative Standard (T1.3) — Cinematic Normal',
      lensType: 'Static (Prime)',
      lighting: 'Low-Key / Film Noir (Deep shadows, high chiaroscuro)',
      lightingTemp: '5600K (Daylight Cool)',
      description: '',
      characters: '',
    });
  };

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)
      ),
    [setEdges]
  );

  // Available shot nodes for connection dropdown
  const availableShotNodes = useMemo(
    () => nodes.filter((n) => n.type === 'shotNode'),
    [nodes]
  );

  // Calculate On-Set Production Statistics
  const shotNodesOnly = availableShotNodes;
  const totalShots = shotNodesOnly.length;
  const completedShots = shotNodesOnly.filter((n) => n.data?.isCompleted).length;
  const completionPercentage = totalShots > 0 ? Math.round((completedShots / totalShots) * 100) : 0;
  const totalTakes = shotNodesOnly.reduce((acc, n) => acc + (n.data?.takeNumber || 1), 0);

  const minimapStyle = useMemo(
    () => ({
      nodeColor: '#6366f1',
      maskColor: 'rgba(2, 6, 23, 0.85)',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
    }),
    []
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* ── Left Sidebar: Minimalist Screenplay Input ── */}
      {!isCanvasMaximized && (
      <aside
        className={`relative flex flex-col border-r border-slate-800 bg-slate-900/95 transition-all duration-300 z-10 ${
          isSidebarOpen ? 'w-96 min-w-[380px]' : 'w-16 min-w-[64px]'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 shadow-lg hover:border-indigo-500 hover:text-white"
          title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 shadow-glow">
              <Film className="h-5 w-5 text-indigo-400" />
            </div>
            {isSidebarOpen && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-bold tracking-tight text-white">FilmDot</span>
                  <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 border border-indigo-800">
                    PWA OFFLINE
                  </span>
                </div>
                <p className="text-xs text-slate-400">Filmmaker's Shot Flow & Storyboard</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings & API Key"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expanded Sidebar Content */}
        {isSidebarOpen ? (
          <div className="flex flex-1 flex-col justify-between overflow-y-auto p-5 space-y-4">
            <div className="space-y-3.5">
              {/* Screenplay Input Header */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5 text-indigo-400" />
                  Screenplay Text
                </label>
                <button
                  onClick={() => setScriptText(DEFAULT_SAMPLE_SCRIPT)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  title="Reset to sample scene"
                >
                  <RotateCcw className="h-3 w-3" />
                  Sample
                </button>
              </div>

              {/* Text Area for Screenplay */}
              <div className="relative">
                <textarea
                  value={scriptText}
                  onChange={(e) => {
                    setScriptText(e.target.value);
                    screenplayDB.saveScreenplay(e.target.value);
                  }}
                  placeholder="Paste your screenplay scene here (slugline, action, character dialogues)..."
                  rows={10}
                  className="w-full resize-none rounded-xl border border-slate-700/80 bg-slate-950 p-3.5 text-xs font-mono leading-relaxed text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
                <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-500 font-mono">
                  {scriptText.length} chars
                </div>
              </div>

              {/* 1. 'Break Down Script' Button */}
              <button
                onClick={handleBreakdown}
                disabled={isLoading || !scriptText.trim()}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 font-display font-semibold text-sm text-white shadow-cinematic hover:bg-indigo-500 hover:shadow-glow active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Splitting Script into Shots...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                    <span>Break Down Script</span>
                  </>
                )}
              </button>

              {/* 2. 'Upload Image & Connect to Node' Button (Right Below Break Down Script) */}
              <button
                onClick={() => imageUploadInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 hover:border-purple-500 text-purple-300 hover:text-white py-2.5 px-4 font-display font-medium text-xs transition-all shadow-sm active:scale-[0.99]"
                title="Upload image and connect to any scene/shot node"
              >
                <ImagePlus className="h-4 w-4 text-purple-400" />
                <span>Upload & Connect Image to Scene</span>
              </button>

              {/* Hidden file input */}
              <input
                ref={imageUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {/* 3. 'Add Shot Manually' Button (for offline / API-down use) */}
              <button
                onClick={() => setManualShotModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-500 text-emerald-300 hover:text-white py-2.5 px-4 font-display font-medium text-xs transition-all shadow-sm active:scale-[0.99]"
                title="Manually add a shot node (no API needed)"
              >
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                <span>Add Shot Manually (Offline)</span>
              </button>

              {/* 4. 'Clear Workspace' Button */}
              <button
                onClick={handleClearWorkspace}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500 text-red-400 hover:text-white py-2.5 px-4 font-display font-medium text-xs transition-all shadow-sm active:scale-[0.99]"
                title="Clear all shots, drawings, and data to start fresh"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Workspace</span>
              </button>

              {/* Error Notice & Fallback Demo Button */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <p className="leading-snug">{error}</p>
                  </div>
                  <div className="pt-1 flex items-center justify-end border-t border-red-500/20 text-[11px]">
                    <button
                      onClick={handleLoadDemo}
                      className="font-medium text-slate-400 hover:text-slate-200"
                    >
                      Load Demo Shots
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* On-Set Production Dashboard Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  On-Set Tracker
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {completedShots}/{totalShots} Wrapped
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono">
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="text-[10px] text-slate-500">TOTAL TAKES</div>
                  <div className="text-sm font-bold text-slate-200">{totalTakes}</div>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="text-[10px] text-slate-500">COMPLETION</div>
                  <div className="text-sm font-bold text-emerald-400">{completionPercentage}%</div>
                </div>
              </div>

              {/* Offline IndexedDB Status Indicator */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60 font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Database className="h-3 w-3" />
                  <span>Dexie DB Sync</span>
                </div>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Wifi className="h-3 w-3 text-emerald-400" /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400">
                      <WifiOff className="h-3 w-3" /> Offline PWA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Mini Sidebar Icons */
          <div className="flex flex-1 flex-col items-center py-6 gap-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Expand Screenplay Input"
            >
              <Clapperboard className="h-5 w-5" />
            </button>
            <button
              onClick={handleBreakdown}
              disabled={isLoading}
              className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600 hover:text-white"
              title="Break Down Script"
            >
              <Sparkles className="h-5 w-5" />
            </button>
            <button
              onClick={() => imageUploadInputRef.current?.click()}
              className="p-2 rounded-lg bg-purple-600/30 text-purple-400 hover:bg-purple-600 hover:text-white"
              title="Upload Image & Connect to Node"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setManualShotModalOpen(true)}
              className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600 hover:text-white"
              title="Add Shot Manually"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
            <button
              onClick={handleClearWorkspace}
              className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white"
              title="Clear Workspace"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings & API Key"
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {completedShots}/{totalShots}
              </span>
              <span className="text-[9px] text-slate-500">SHOTS</span>
            </div>
          </div>
        )}
      </aside>
      )}

      {/* ── Main Area: React Flow Node Graphing Canvas ── */}
      <main className="relative flex-1 h-full w-full bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          {/* Subtle cinematic grid background */}
          <Background color="#334155" gap={28} size={1.2} />

          {/* Flow Controls */}
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!fill-slate-300 hover:[&>button]:!bg-indigo-600" />

          {/* Minimap */}
          <MiniMap style={minimapStyle} zoomable pannable />

          {/* Top Info Panel */}
          <Panel position="top-right" className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 py-2 text-xs shadow-xl">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>{nodes.length} Nodes</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>{completedShots} Wrapped</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5 text-indigo-300 font-mono">
                <Database className="h-3.5 w-3.5 text-indigo-400" />
                <span>IndexedDB Synced</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <button
                onClick={() => setLiveStatsModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                title="View Live Analytics"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="hidden sm:inline">Live Stats</span>
              </button>
              <div className="h-3 w-px bg-slate-700" />
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                title="Settings & API Key"
              >
                <Settings className="h-4 w-4 text-indigo-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <div className="h-3 w-px bg-slate-700" />
              <button
                onClick={() => {
                  setIsCanvasMaximized(!isCanvasMaximized);
                  if (!isCanvasMaximized) setIsSidebarOpen(false);
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                title={isCanvasMaximized ? 'Restore Layout' : 'Maximize Canvas'}
              >
                {isCanvasMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </main>

      {/* ── Modal: Connect Uploaded Image to Scene Node ── */}
      {uploadModalOpen && pendingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/60">
                  <ImagePlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-white text-sm">
                    Connect Image to Scene Node
                  </h3>
                  <p className="text-xs text-slate-400">
                    Attach reference still or moodboard to a shot in the graph
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
              <img
                src={pendingImage.dataUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-300 border border-slate-700">
                {pendingImage.filename}
              </span>
            </div>

            {/* Image Title / Caption */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Reference Label / Title
              </label>
              <input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="e.g., Neon Alley Lighting Ref, Cyberpunk Props"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Select Target Shot Node */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Select Scene / Shot Node to Connect:
              </label>
              <select
                value={selectedTargetNodeId}
                onChange={(e) => setSelectedTargetNodeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {availableShotNodes.map((shotNode) => (
                  <option key={shotNode.id} value={shotNode.id}>
                    SCENE {shotNode.data?.scene_number || '1'} • {shotNode.data?.shot_id} ({shotNode.data?.shot_type || 'Shot'})
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectImageToNode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-glow transition-all"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Connect to Scene Node</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Manually Add a Shot (Offline Mode) ── */}
      {manualShotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-white text-sm">
                    Add Shot Manually
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create a shot node without AI — works offline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManualShotModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Shot Description *</label>
              <textarea
                value={manualShot.description}
                onChange={(e) => setManualShot({ ...manualShot, description: e.target.value })}
                placeholder="Describe the shot action, framing, and atmosphere..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Shot Type */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Shot Type</label>
              <select
                value={manualShot.shot_type}
                onChange={(e) => setManualShot({ ...manualShot, shot_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option>Establishing Wide Shot (EWS)</option>
                <option>Wide Shot (WS / Master)</option>
                <option>Medium Shot (MS)</option>
                <option>Medium Close-up (MCU)</option>
                <option>Close-up (CU)</option>
                <option>Extreme Close-up (ECU)</option>
                <option>Over-the-Shoulder (OTS)</option>
                <option>Point of View (POV)</option>
                <option>Low Angle Hero Shot</option>
                <option>High Angle Shot</option>
                <option>Two Shot</option>
              </select>
            </div>

            {/* Camera Movement */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Camera Movement</label>
              <select
                value={manualShot.camera_movement}
                onChange={(e) => setManualShot({ ...manualShot, camera_movement: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option>Static (Locked-off / Tripod)</option>
                <option>Slow Push-in (Dolly In)</option>
                <option>Slow Pull-out (Dolly Out)</option>
                <option>Pan Left</option>
                <option>Pan Right</option>
                <option>Tilt Up</option>
                <option>Tilt Down</option>
                <option>Tracking / Trucking Shot</option>
                <option>Steadicam / Gimbal Follow</option>
                <option>Handheld (Organic Shaky)</option>
                <option>Crane / Jib Vertical Arc</option>
              </select>
            </div>

            {/* Characters */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Characters (comma-separated)</label>
              <input
                type="text"
                value={manualShot.characters}
                onChange={(e) => setManualShot({ ...manualShot, characters: e.target.value })}
                placeholder="e.g., KALE, MAYA"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setManualShotModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualShot}
                disabled={!manualShot.description.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Shot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings & Gemini API Key Modal ── */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onApiKeySaved={() => {
          setError(null);
        }}
      />

      {/* ── Live Stats (Umami) Modal ── */}
      <LiveStatsModal
        isOpen={liveStatsModalOpen}
        onClose={() => setLiveStatsModalOpen(false)}
      />
    </div>
  );
}
