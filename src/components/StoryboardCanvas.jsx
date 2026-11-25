import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricImage, PencilBrush } from 'fabric';
import {
  PenTool,
  Eraser,
  Undo2,
  Trash2,
  Upload,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Palette,
  History,
  X,
} from 'lucide-react';
import { canvasDrawingsDB } from '../db/database';

const PRESET_COLORS = [
  { name: 'Paper White', value: '#f8fafc' },
  { name: 'Indigo Accent', value: '#6366f1' },
  { name: 'Sky Cyan', value: '#38bdf8' },
  { name: 'Emerald', value: '#34d399' },
  { name: 'Amber Gold', value: '#fbbf24' },
  { name: 'Film Crimson', value: '#f43f5e' },
  { name: 'Neon Purple', value: '#c084fc' },
  { name: 'Slate Gray', value: '#64748b' },
];

const CANVAS_BG_COLOR = '#020617'; // slate-950

export default function StoryboardCanvas({
  shotId,
  aspectRatio = '16/9',
  onSaveFrame,
  compact = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasElementRef = useRef(null);
  const fabricRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgImageRef = useRef(null);
  const isHoveredRef = useRef(false);
  const baseImageLoadedRef = useRef(null);

  // Tools state
  const [activeTool, setActiveTool] = useState('brush'); // 'brush' | 'eraser'
  const [brushColor, setBrushColor] = useState('#f8fafc');
  const [brushSize, setBrushSize] = useState(4);
  const [refImageOpacity, setRefImageOpacity] = useState(0.4);
  const [hasRefImage, setHasRefImage] = useState(false);
  const [showRefImage, setShowRefImage] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 960, height: 540 });
  const [canUndo, setCanUndo] = useState(false);
  const [undoToast, setUndoToast] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [snapshots, setSnapshots] = useState([]);

  // Undo latest stroke on the canvas and sync to IndexedDB
  // CRITICAL FIX: Only removes newly drawn strokes. NEVER deletes existing database record!
  const undoLastStroke = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    if (objects.length === 0) return;

    // Filter out the permanent base loaded image if present
    const nonBaseObjects = objects.filter((obj) => !obj.isBaseLayer);

    if (nonBaseObjects.length > 0) {
      // Remove top-most drawn stroke
      const lastStroke = nonBaseObjects[nonBaseObjects.length - 1];
      canvas.remove(lastStroke);
      canvas.requestRenderAll();
      setCanUndo(nonBaseObjects.length > 1);

      // Trigger visual toast
      setUndoToast(true);
      setTimeout(() => setUndoToast(false), 1200);

      // Sync updated canvas to IndexedDB - NEVER delete record on undo!
      if (shotId) {
        const dataUrl = canvas.toDataURL({ format: 'png' });
        canvasDrawingsDB.saveDrawing(shotId, dataUrl).catch(console.error);
      }
    } else {
      // Nothing more to undo in this session
      setCanUndo(false);
    }
  }, [shotId]);

  // Keyboard listener strictly isolated to this canvas when hovered / active
  // CRITICAL FIX: Removed Ctrl+C (which intercepted copying) and strictly requires mouse hover
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing text in an input or textarea
      const targetTag = e.target?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

      // Only respond if the user is hovering over THIS specific canvas
      if (!isHoveredRef.current) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        undoLastStroke();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastStroke]);

  // Helper to fit background reference image inside canvas boundaries
  const fitBgImage = useCallback((img, targetWidth, targetHeight) => {
    if (!img) return;
    const imgWidth = img.width || 1;
    const imgHeight = img.height || 1;
    const scale = Math.min(targetWidth / imgWidth, targetHeight / imgHeight);

    img.set({
      scaleX: scale,
      scaleY: scale,
      originX: 'center',
      originY: 'center',
      left: targetWidth / 2,
      top: targetHeight / 2,
      selectable: false,
      evented: false,
      opacity: showRefImage ? refImageOpacity : 0,
    });
  }, [showRefImage, refImageOpacity]);

  const fitBgImageRef = useRef(fitBgImage);
  useEffect(() => {
    fitBgImageRef.current = fitBgImage;
  }, [fitBgImage]);

  const brushSettingsRef = useRef({ brushColor, brushSize });
  useEffect(() => {
    brushSettingsRef.current = { brushColor, brushSize };
  }, [brushColor, brushSize]);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasElementRef.current || !containerRef.current) return;
    let isDisposed = false;

    const container = containerRef.current;
    const computedWidth = container.clientWidth || 960;
    // Calculate 16:9 cinematic height based on container width
    const [aspectW, aspectH] = (aspectRatio || '16/9').split('/').map(Number);
    const computedHeight = Math.round((computedWidth * (aspectH || 9)) / (aspectW || 16));

    setCanvasDimensions({ width: computedWidth, height: computedHeight });

    const canvas = new FabricCanvas(canvasElementRef.current, {
      width: computedWidth,
      height: computedHeight,
      backgroundColor: CANVAS_BG_COLOR,
      isDrawingMode: true,
      allowTouchScrolling: false, // critical for stylus/touch drawing
      stopContextMenu: true,
      fireRightClick: true,
      enableRetinaScaling: true,
    });

    // Create and configure PencilBrush for drawing tablet/stylus smoothness
    const brush = new PencilBrush(canvas);
    brush.color = brushSettingsRef.current.brushColor;
    brush.width = brushSettingsRef.current.brushSize;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    brush.decimate = 2; // Smooth curves on stylus input
    canvas.freeDrawingBrush = brush;

    fabricRef.current = canvas;

    // Load saved base64 drawing from IndexedDB
    if (shotId) {
      canvasDrawingsDB.getDrawing(shotId).then(async (record) => {
        if (isDisposed || !fabricRef.current) return;
        if (record?.dataUrl) {
          try {
            const savedImg = await FabricImage.fromURL(record.dataUrl);
            if (isDisposed || !fabricRef.current) return;
            savedImg.set({
              selectable: false,
              evented: false,
              originX: 'left',
              originY: 'top',
              left: 0,
              top: 0,
            });
            savedImg.isBaseLayer = true;
            baseImageLoadedRef.current = savedImg;
            fabricRef.current.add(savedImg);
            fabricRef.current.requestRenderAll();
            setCanUndo(false); // Base saved layer cannot be destroyed by undo
          } catch (e) {
            console.warn('Could not restore canvas drawing:', e);
          }
        }
      });
    }

    // Auto-save sketch stroke to IndexedDB as base64 string
    const handlePathCreated = () => {
      setCanUndo(true);
      if (shotId && fabricRef.current) {
        const dataUrl = fabricRef.current.toDataURL({ format: 'png' });
        canvasDrawingsDB.saveDrawing(shotId, dataUrl).catch(console.error);
      }
    };
    canvas.on('path:created', handlePathCreated);

    // Responsive resize handler with aspect ratio preservation
    const handleResize = () => {
      if (isDisposed || !containerRef.current || !fabricRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      if (!newWidth || newWidth <= 0) return;
      const newHeight = Math.round((newWidth * (aspectH || 9)) / (aspectW || 16));

      setCanvasDimensions({ width: newWidth, height: newHeight });

      const c = fabricRef.current;
      c.setDimensions({ width: newWidth, height: newHeight });

      // Re-center and fit background reference if present
      if (bgImageRef.current) {
        fitBgImageRef.current?.(bgImageRef.current, newWidth, newHeight);
      }
      c.requestRenderAll();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.dispose().catch?.(() => {});
      fabricRef.current = null;
    };
  }, [aspectRatio, shotId]);

  // Synchronize brush settings when tool, color, or size change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;

    canvas.isDrawingMode = true;

    if (activeTool === 'eraser') {
      // Stylus Eraser: paint with dark canvas background color with wider stroke
      canvas.freeDrawingBrush.color = CANVAS_BG_COLOR;
      canvas.freeDrawingBrush.width = Math.max(brushSize * 3, 12);
    } else {
      // Stylus Brush
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, brushColor, brushSize]);

  // Upload Background Reference Image (Moodboard)
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl || !fabricRef.current) return;

      const canvas = fabricRef.current;
      const width = canvas.getWidth();
      const height = canvas.getHeight();

      const img = await FabricImage.fromURL(dataUrl);
      fitBgImage(img, width, height);

      bgImageRef.current = img;
      canvas.backgroundImage = img;
      setHasRefImage(true);
      setShowRefImage(true);
      canvas.requestRenderAll();
    };

    reader.readAsDataURL(file);
    // Reset file input so user can re-upload same file if needed
    event.target.value = '';
  };

  // Update Reference Image Opacity
  const handleOpacityChange = (newOpacity) => {
    setRefImageOpacity(newOpacity);
    if (bgImageRef.current && fabricRef.current) {
      bgImageRef.current.set({ opacity: showRefImage ? newOpacity : 0 });
      fabricRef.current.requestRenderAll();
    }
  };

  // Toggle Visibility of Reference Moodboard
  const toggleRefVisibility = () => {
    const nextShow = !showRefImage;
    setShowRefImage(nextShow);
    if (bgImageRef.current && fabricRef.current) {
      bgImageRef.current.set({ opacity: nextShow ? refImageOpacity : 0 });
      fabricRef.current.requestRenderAll();
    }
  };

  // Remove Reference Moodboard
  const removeRefImage = () => {
    if (!fabricRef.current) return;
    fabricRef.current.backgroundImage = null;
    bgImageRef.current = null;
    setHasRefImage(false);
    fabricRef.current.requestRenderAll();
  };

  // Clear Canvas (removes sketch strokes, preserves moodboard)
  const clearSketches = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length === 0) return;

    const confirmed = window.confirm(
      'Are you sure you want to clear this drawing?\n\n(Previous versions are saved in History and can be restored at any time.)'
    );
    if (!confirmed) return;

    // Clear drawn objects
    canvas.clear();
    canvas.backgroundColor = CANVAS_BG_COLOR;

    // Restore background moodboard image if active
    if (bgImageRef.current) {
      canvas.backgroundImage = bgImageRef.current;
    }
    canvas.requestRenderAll();

    // Remove drawing from IndexedDB
    if (shotId) {
      canvasDrawingsDB.deleteDrawing(shotId).catch(console.error);
    }
    setCanUndo(false);
  };

  // Open Revision Snapshots Modal
  const handleOpenHistory = async () => {
    if (!shotId) return;
    try {
      const historyList = await canvasDrawingsDB.getSnapshots(shotId);
      setSnapshots(historyList || []);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to load drawing snapshots:', err);
    }
  };

  // Restore a snapshot revision onto canvas
  const handleRestoreSnapshot = async (dataUrl) => {
    if (!dataUrl || !fabricRef.current) return;
    try {
      const canvas = fabricRef.current;
      canvas.clear();
      canvas.backgroundColor = CANVAS_BG_COLOR;
      if (bgImageRef.current) {
        canvas.backgroundImage = bgImageRef.current;
      }

      const restoredImg = await FabricImage.fromURL(dataUrl);
      restoredImg.set({
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
      });
      restoredImg.isBaseLayer = true;
      baseImageLoadedRef.current = restoredImg;
      canvas.add(restoredImg);
      canvas.requestRenderAll();
      setCanUndo(false);

      if (shotId) {
        await canvasDrawingsDB.saveDrawing(shotId, dataUrl);
      }
      setShowHistoryModal(false);
    } catch (e) {
      console.error('Failed to restore snapshot:', e);
    }
  };

  // Export Canvas Frame as PNG
  const exportFrame = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2, // High-res export for pitch decks and storyboards
    });

    if (onSaveFrame) {
      onSaveFrame(dataUrl);
    } else {
      const link = document.createElement('a');
      link.download = `storyboard-frame-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className={`panel-card bg-cinema-surface border border-cinema-border rounded-xl shadow-2xl flex flex-col overflow-hidden nodrag nowheel ${className}`}
    >
      {/* ── Toolbar Header ── */}
      <div className={`flex flex-wrap items-center justify-between gap-2 bg-cinema-card border-b border-cinema-border text-cinema-text ${compact ? 'p-2' : 'px-4 py-3'}`}>
        {/* Left: Tool Selection & Presets */}
        <div className="flex items-center gap-2">
          {/* Brush Tool */}
          <button
            onClick={() => setActiveTool('brush')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTool === 'brush'
                ? 'bg-accent text-white shadow-glow'
                : 'text-cinema-muted hover:text-cinema-heading hover:bg-cinema-surface'
            }`}
            title="Brush (Stylus / Pen)"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTool === 'eraser'
                ? 'bg-accent text-white shadow-glow'
                : 'text-cinema-muted hover:text-cinema-heading hover:bg-cinema-surface'
            }`}
            title="Eraser (Stylus Inverted)"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          {/* Undo Button */}
          <button
            onClick={undoLastStroke}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              canUndo
                ? 'text-cinema-text hover:text-white hover:bg-cinema-surface border border-cinema-border/60 shadow-sm active:scale-95'
                : 'text-cinema-muted/40 cursor-not-allowed opacity-50'
            }`}
            title="Undo Last Stroke (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Undo</span>
            <span className="text-[10px] font-mono text-cinema-muted hidden lg:inline">(Ctrl+Z)</span>
          </button>

          {/* Version Snapshots History */}
          <button
            onClick={handleOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-cinema-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
            title="Revision History & Snapshots"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Clear Canvas */}
          <button
            onClick={clearSketches}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-cinema-muted hover:text-reel-red hover:bg-reel-red/10 transition-colors"
            title="Clear All Strokes"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear</span>
          </button>

          <div className="h-6 w-px bg-cinema-border mx-1" />

          {/* Color Swatches */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map(({ name, value }) => (
              <button
                key={value}
                onClick={() => {
                  setBrushColor(value);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  brushColor === value && activeTool === 'brush'
                    ? 'border-white scale-110 shadow-glow'
                    : 'border-cinema-border/60 hover:scale-105'
                }`}
                style={{ backgroundColor: value }}
                title={name}
              />
            ))}

            {/* Custom Color Input */}
            <label
              className="relative flex items-center justify-center w-6 h-6 rounded-full border border-cinema-border cursor-pointer hover:border-accent ml-1 overflow-hidden"
              title="Custom Color"
            >
              <Palette className="w-3.5 h-3.5 text-cinema-muted" />
              <input
                type="color"
                value={brushColor}
                onChange={(e) => {
                  setBrushColor(e.target.value);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Right: Brush Size & Moodboard Reference */}
        <div className="flex items-center gap-3">
          {/* Brush Size Slider (1px to 20px) */}
          <div className="flex items-center gap-2 bg-cinema-surface px-3 py-1 rounded-lg border border-cinema-border">
            <span className="text-xs font-mono text-cinema-muted w-8">{brushSize}px</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 h-1.5 bg-cinema-border rounded-lg appearance-none cursor-pointer accent-accent"
              title={`Brush Size: ${brushSize}px`}
            />
            {/* Visual stroke preview dot */}
            <div
              className="rounded-full bg-accent ml-1 shrink-0"
              style={{
                width: `${Math.max(brushSize, 4)}px`,
                height: `${Math.max(brushSize, 4)}px`,
              }}
            />
          </div>

          <div className="h-6 w-px bg-cinema-border" />

          {/* Reference Image (Moodboard) Controls */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-cinema-surface border border-cinema-border text-cinema-text hover:border-accent hover:text-accent-light transition-all"
            title="Upload Reference / Moodboard"
          >
            <Upload className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Moodboard</span>
          </button>

          {hasRefImage && (
            <div className="flex items-center gap-1.5 bg-cinema-surface px-2 py-1 rounded-lg border border-cinema-border">
              <button
                onClick={toggleRefVisibility}
                className="p-1 rounded text-cinema-muted hover:text-cinema-heading transition-colors"
                title={showRefImage ? 'Hide Reference' : 'Show Reference'}
              >
                {showRefImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={refImageOpacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-16 h-1.5 bg-cinema-border rounded-lg appearance-none cursor-pointer accent-accent"
                title={`Reference Opacity: ${Math.round(refImageOpacity * 100)}%`}
              />

              <button
                onClick={removeRefImage}
                className="p-1 rounded text-cinema-muted hover:text-reel-red transition-colors"
                title="Remove Reference Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Export PNG */}
          <button
            onClick={exportFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-accent hover:bg-accent-dark text-white font-medium shadow-cinematic transition-all"
            title="Export Frame PNG"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ── Canvas Viewport Area ── */}
      <div
        ref={containerRef}
        className={`relative w-full flex-1 flex items-center justify-center bg-cinema-bg select-none ${compact ? 'p-2' : 'p-4'}`}
        style={{
          // Critical optimization for touch screen / Apple Pencil / Wacom tablets
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          className="relative rounded-lg overflow-hidden border border-cinema-border/70 shadow-2xl bg-slate-950"
          style={{
            width: canvasDimensions.width,
            height: canvasDimensions.height,
            touchAction: 'none',
          }}
        >
          {/* HTML5 Canvas Managed by Fabric.js */}
          <canvas
            ref={canvasElementRef}
            style={{
              touchAction: 'none',
            }}
          />

          {/* Stylus active indicator badge */}
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-2 bg-cinema-card/80 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-mono text-cinema-muted border border-cinema-border/40">
            <span>{canvasDimensions.width}x{canvasDimensions.height}</span>
            <span className="text-accent">•</span>
            <span>{activeTool === 'eraser' ? 'ERASER' : 'PEN'}</span>
          </div>

          {/* Undo visual toast alert */}
          {undoToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 bg-indigo-600/90 text-white text-xs px-3 py-1 rounded-full shadow-glow animate-fade-in font-medium">
              <Undo2 className="w-3.5 h-3.5" />
              <span>Stroke Undone</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Revision Snapshots History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-white text-sm">
                    Revision Snapshots ({shotId})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select a previous auto-saved version to restore your storyboard frame
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No previous snapshots found for this shot. New strokes will be backed up automatically.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
                {snapshots.map((snap, i) => (
                  <div
                    key={snap.id || i}
                    className="border border-slate-800 hover:border-indigo-500 rounded-xl bg-slate-950 p-2.5 flex flex-col justify-between group transition-all"
                  >
                    <div className="rounded-lg overflow-hidden bg-slate-900 aspect-video mb-2 flex items-center justify-center border border-slate-800/80">
                      <img
                        src={snap.dataUrl}
                        alt={`Snapshot ${i + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span>{new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="text-[10px] text-slate-600 font-mono">#{snap.id}</span>
                    </div>
                    <button
                      onClick={() => handleRestoreSnapshot(snap.dataUrl)}
                      className="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Version</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
