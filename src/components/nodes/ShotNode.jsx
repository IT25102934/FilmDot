import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Clapperboard,
  Video,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Camera,
  Sun,
  Edit2,
  Check,
  X,
  Aperture,
  Sparkles,
} from 'lucide-react';
import StoryboardCanvas from '../StoryboardCanvas';
import { checklistDB } from '../../db/database';
import {
  PREMADE_SHOT_TYPES,
  PREMADE_CAMERA_MOVEMENTS,
  PREMADE_LENSES,
  PREMADE_LIGHTING_STYLES,
  PREMADE_COLOR_TEMPS,
} from '../../constants/cinematicPresets';

function ShotNode({ id, data }) {
  const {
    shot_id = 'SHOT-001',
    scene_number = '1',
    shot_type: initialShotType = 'Medium Shot',
    camera_movement: initialCameraMovement = 'Static',
    lens: initialLens = '35mm T1.3 (Prime)',
    lensType: initialLensType = 'Static (Prime)',
    lighting: initialLighting = 'Low-Key Noir (High Contrast)',
    lightingTemp: initialLightingTemp = '5600K (Daylight Cool)',
    description = 'No description provided.',
    characters = [],
    notes: initialNotes = '',
    takeNumber: initialTake = 1,
    isCompleted: initialCompleted = false,
    onUpdateNodeData,
  } = data;

  // Editable fields state
  const [shotType, setShotType] = useState(initialShotType);
  const [isEditingShotType, setIsEditingShotType] = useState(false);
  const [customShotInput, setCustomShotInput] = useState('');
  const [showCustomShotField, setShowCustomShotField] = useState(false);

  const [cameraMovement, setCameraMovement] = useState(initialCameraMovement);
  const [isCustomCamera, setIsCustomCamera] = useState(false);
  const [customCameraInput, setCustomCameraInput] = useState('');

  const [lens, setLens] = useState(initialLens);
  const [lensType, setLensType] = useState(initialLensType);
  const [customLensInput, setCustomLensInput] = useState('');
  const [isCustomLens, setIsCustomLens] = useState(false);

  const [lighting, setLighting] = useState(initialLighting);
  const [lightingTemp, setLightingTemp] = useState(initialLightingTemp);
  const [customLightingInput, setCustomLightingInput] = useState('');
  const [isCustomLighting, setIsCustomLighting] = useState(false);

  // Panels and tools state
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'lighting' | 'notes'
  const [notes, setNotes] = useState(initialNotes);
  const [takeNumber, setTakeNumber] = useState(initialTake);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState([]);

  // Load on-set checklist from IndexedDB
  useEffect(() => {
    let isMounted = true;
    checklistDB.initializeShotChecklist(shot_id).then((items) => {
      if (isMounted) setChecklist(items);
    });
    return () => {
      isMounted = false;
    };
  }, [shot_id]);

  // Handle Shot Type Selection / Custom Creation
  const handleSelectShotType = (selected) => {
    setShotType(selected);
    setShowCustomShotField(false);
    setIsEditingShotType(false);
    onUpdateNodeData?.(id, { shot_type: selected });
  };

  const handleApplyCustomShot = () => {
    if (!customShotInput.trim()) return;
    const finalShotType = customShotInput.trim();
    setShotType(finalShotType);
    setShowCustomShotField(false);
    setIsEditingShotType(false);
    setCustomShotInput('');
    onUpdateNodeData?.(id, { shot_type: finalShotType });
  };

  // Handle Camera Movement Selection / Custom Creation
  const handleSelectCameraMovement = (movement) => {
    setCameraMovement(movement);
    setIsCustomCamera(false);
    onUpdateNodeData?.(id, { camera_movement: movement });
  };

  const handleApplyCustomCamera = () => {
    if (!customCameraInput.trim()) return;
    const finalMovement = customCameraInput.trim();
    setCameraMovement(finalMovement);
    setIsCustomCamera(false);
    setCustomCameraInput('');
    onUpdateNodeData?.(id, { camera_movement: finalMovement });
  };

  // Handle Lens Selection / Custom Creation
  const handleSelectLens = (selectedLensObj) => {
    setLens(selectedLensObj.label);
    setLensType(selectedLensObj.type);
    setIsCustomLens(false);
    onUpdateNodeData?.(id, {
      lens: selectedLensObj.label,
      lensType: selectedLensObj.type,
    });
  };

  const handleToggleLensType = (type) => {
    setLensType(type);
    onUpdateNodeData?.(id, { lensType: type });
  };

  const handleApplyCustomLens = () => {
    if (!customLensInput.trim()) return;
    const finalLens = `${customLensInput.trim()} (${lensType})`;
    setLens(finalLens);
    setIsCustomLens(false);
    setCustomLensInput('');
    onUpdateNodeData?.(id, { lens: finalLens, lensType });
  };

  // Handle Lighting Selection / Custom Creation
  const handleSelectLighting = (style) => {
    setLighting(style);
    setIsCustomLighting(false);
    onUpdateNodeData?.(id, { lighting: style });
  };

  const handleSelectLightingTemp = (temp) => {
    setLightingTemp(temp);
    onUpdateNodeData?.(id, { lightingTemp: temp });
  };

  const handleApplyCustomLighting = () => {
    if (!customLightingInput.trim()) return;
    const finalLighting = customLightingInput.trim();
    setLighting(finalLighting);
    setIsCustomLighting(false);
    setCustomLightingInput('');
    onUpdateNodeData?.(id, { lighting: finalLighting });
  };

  // On-Set Controls
  const handleNotesChange = (e) => {
    const updatedNotes = e.target.value;
    setNotes(updatedNotes);
    onUpdateNodeData?.(id, { notes: updatedNotes });
  };

  const handleTakeChange = (delta) => {
    const updatedTake = Math.max(1, takeNumber + delta);
    setTakeNumber(updatedTake);
    onUpdateNodeData?.(id, { takeNumber: updatedTake });
  };

  const toggleCompleted = () => {
    const nextCompleted = !isCompleted;
    setIsCompleted(nextCompleted);
    onUpdateNodeData?.(id, { isCompleted: nextCompleted });
  };

  const handleToggleChecklistItem = async (itemId, currentDone) => {
    const nextDone = !currentDone;
    await checklistDB.toggleItem(itemId, nextDone);
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isDone: nextDone } : item))
    );
  };

  const completedChecklistCount = checklist.filter((item) => item.isDone).length;

  return (
    <div
      className={`w-[480px] rounded-xl border transition-all duration-300 shadow-2xl overflow-hidden ${
        isCompleted
          ? 'bg-slate-900/95 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
          : 'bg-slate-900/95 border-slate-700/80 hover:border-indigo-500/60 shadow-cinematic'
      }`}
    >
      {/* React Flow Wiring Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900"
      />

      {/* ── Node Header with Scene Badge, Shot ID & Editable Shot Type ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scene Badge */}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
            <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
            SCENE {scene_number}
          </span>

          {/* Shot Identifier */}
          <span className="text-sm font-bold text-slate-100 font-display">
            {shot_id}
          </span>

          {/* Editable Shot Type Badge */}
          <button
            onClick={() => setIsEditingShotType(!isEditingShotType)}
            className="nodrag group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800/90 text-indigo-300 hover:text-white hover:bg-indigo-950 border border-slate-700 hover:border-indigo-500/70 transition-all font-medium"
            title="Click to edit shot type / choose templates"
          >
            <span>{shotType}</span>
            <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-400" />
          </button>
        </div>

        {/* On-Set Completion Check-off */}
        <button
          onClick={toggleCompleted}
          className={`nodrag flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200 hover:border-slate-600'
          }`}
          title={isCompleted ? 'Mark as Pending' : 'Mark as Wrapped / Done'}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>WRAPPED</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 text-slate-500" />
              <span>ON SET</span>
            </>
          )}
        </button>
      </div>

      {/* ── Shot Type Selection Drawer (When Director Clicks Shot Type Badge) ── */}
      {isEditingShotType && (
        <div className="nodrag px-4 py-3 bg-slate-950 border-b border-indigo-500/30 animate-fade-in space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Select Shot Type Template or Custom
            </span>
            <button
              onClick={() => setIsEditingShotType(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pre-made Templates Dropdown & Tags */}
          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {PREMADE_SHOT_TYPES.map((template) => (
              <button
                key={template}
                onClick={() => handleSelectShotType(template)}
                className={`text-left text-[11px] px-2 py-1.5 rounded-lg border transition-all truncate ${
                  shotType === template
                    ? 'bg-indigo-600 text-white border-indigo-400 font-medium'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850'
                }`}
                title={template}
              >
                {template}
              </button>
            ))}
          </div>

          {/* "+ Custom Shot" Button & Input */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            {!showCustomShotField ? (
              <button
                onClick={() => setShowCustomShotField(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Shot (Director's Choice)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  value={customShotInput}
                  onChange={(e) => setCustomShotInput(e.target.value)}
                  placeholder="e.g. Snorricam Torso Mount, Split-Diopter"
                  className="flex-1 bg-slate-900 border border-indigo-500/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomShot()}
                />
                <button
                  onClick={handleApplyCustomShot}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  title="Save Custom Shot"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowCustomShotField(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cinematography Quick Info Banner ── */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          {/* Camera movement summary */}
          <div className="flex items-center gap-1 text-indigo-300 font-medium truncate max-w-[170px]" title={cameraMovement}>
            <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{cameraMovement}</span>
          </div>

          {/* Lens summary */}
          <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px] truncate max-w-[140px]" title={lens}>
            <Aperture className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{lens}</span>
          </div>
        </div>

        {/* Lighting Badge */}
        <div className="flex items-center gap-1 text-amber-300/90 text-[11px] font-mono truncate max-w-[130px]" title={`${lighting} (${lightingTemp})`}>
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{lightingTemp.split(' ')[0]}</span>
        </div>
      </div>

      {/* ── Shot Description ── */}
      <div className="px-4 py-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 border-b border-slate-800/70">
        <p className="line-clamp-2 italic text-slate-300 font-sans">
          "{description}"
        </p>
        {characters && characters.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <Users className="w-3 h-3 text-slate-500" />
            <span className="truncate">{characters.join(', ')}</span>
          </div>
        )}
      </div>

      {/* ── Embedded Storyboard Canvas (with Undo & Base64 Persistence) ── */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Storyboard Sketch
          </span>
          <button
            onClick={() => setIsCanvasCollapsed(!isCanvasCollapsed)}
            className="nodrag text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 p-0.5"
            title={isCanvasCollapsed ? 'Expand Canvas' : 'Collapse Canvas'}
          >
            {isCanvasCollapsed ? (
              <>
                <span>Expand</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {!isCanvasCollapsed && (
          <div className="nodrag rounded-lg overflow-hidden border border-slate-800">
            <StoryboardCanvas shotId={shot_id} compact={true} aspectRatio="16/9" />
          </div>
        )}
      </div>

      {/* ── Cinematography & Director Control Tabs ── */}
      <div className="nodrag bg-slate-950/95 border-b border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'camera'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera & Lens</span>
          </button>

          <button
            onClick={() => setActiveTab('lighting')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'lighting'
                ? 'border-amber-500 text-amber-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Lighting Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'notes'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Notes & Takes</span>
          </button>
        </div>

        {/* Tab 1: Camera & Lens Editor */}
        {activeTab === 'camera' && (
          <div className="p-3.5 space-y-3 animate-fade-in text-xs">
            {/* Camera Movement Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  Camera Movement:
                </label>
                <button
                  onClick={() => setIsCustomCamera(!isCustomCamera)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  {isCustomCamera ? 'Choose Template' : '+ Custom Movement'}
                </button>
              </div>

              {!isCustomCamera ? (
                <select
                  value={cameraMovement}
                  onChange={(e) => handleSelectCameraMovement(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {PREMADE_CAMERA_MOVEMENTS.map((mov) => (
                    <option key={mov} value={mov}>
                      {mov}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customCameraInput}
                    onChange={(e) => setCustomCameraInput(e.target.value)}
                    placeholder="e.g. Low Snorricam Push, Orbital Spin"
                    className="flex-1 bg-slate-900 border border-indigo-500/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomCamera()}
                  />
                  <button
                    onClick={handleApplyCustomCamera}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                    title="Apply Custom Movement"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Lens Selector (Static Prime vs Conditional Zoom) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Aperture className="w-3.5 h-3.5 text-purple-400" />
                  Lens Configuration:
                </label>

                {/* Static Prime vs Conditional Zoom Switch */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                  <button
                    onClick={() => handleToggleLensType('Static (Prime)')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      lensType.includes('Prime') || lensType.includes('Static')
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Static (Prime)
                  </button>
                  <button
                    onClick={() => handleToggleLensType('Conditional (Zoom)')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      lensType.includes('Zoom') || lensType.includes('Conditional')
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Conditional (Zoom)
                  </button>
                </div>
              </div>

              {!isCustomLens ? (
                <div className="space-y-1.5">
                  <select
                    value={lens}
                    onChange={(e) => {
                      const found = PREMADE_LENSES.find((l) => l.label === e.target.value);
                      if (found) handleSelectLens(found);
                      else setLens(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  >
                    {PREMADE_LENSES.map((l) => (
                      <option key={l.label} value={l.label}>
                        {l.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsCustomLens(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                    >
                      + Custom Lens Spec
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customLensInput}
                    onChange={(e) => setCustomLensInput(e.target.value)}
                    placeholder="e.g. Cooke S4/i 35mm T2.0, Arri Signature 58mm"
                    className="flex-1 bg-slate-900 border border-purple-500/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomLens()}
                  />
                  <button
                    onClick={handleApplyCustomLens}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs"
                    title="Apply Custom Lens"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsCustomLens(false)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Lighting Details Editor */}
        {activeTab === 'lighting' && (
          <div className="p-3.5 space-y-3 animate-fade-in text-xs">
            {/* Lighting Style */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Lighting Setup & Style:
                </label>
                <button
                  onClick={() => setIsCustomLighting(!isCustomLighting)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                >
                  {isCustomLighting ? 'Choose Template' : '+ Custom Lighting'}
                </button>
              </div>

              {!isCustomLighting ? (
                <select
                  value={lighting}
                  onChange={(e) => handleSelectLighting(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {PREMADE_LIGHTING_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customLightingInput}
                    onChange={(e) => setCustomLightingInput(e.target.value)}
                    placeholder="e.g. Aputure 600d overhead lantern, Quasar background"
                    className="flex-1 bg-slate-900 border border-amber-500/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomLighting()}
                  />
                  <button
                    onClick={handleApplyCustomLighting}
                    className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs"
                    title="Apply Custom Lighting"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Color Temperature */}
            <div className="pt-1 border-t border-slate-800/80">
              <label className="text-slate-300 font-medium block mb-1">
                Color Temperature & Tint:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PREMADE_COLOR_TEMPS.map((temp) => (
                  <button
                    key={temp}
                    onClick={() => handleSelectLightingTemp(temp)}
                    className={`text-left text-[11px] px-2 py-1 rounded-md border font-mono transition-all truncate ${
                      lightingTemp === temp
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notes & Takes */}
        {activeTab === 'notes' && (
          <div className="p-3.5 space-y-3 animate-fade-in text-xs">
            {/* Take Number Recorder */}
            <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Take Number:</span>
                <span className="px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800/80 text-indigo-300 font-mono font-bold text-sm">
                  TAKE {takeNumber}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTakeChange(-1)}
                  disabled={takeNumber <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-colors"
                  title="Previous Take"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleTakeChange(1)}
                  className="w-7 h-7 flex items-center justify-center rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-sm"
                  title="Next Take"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom Director & DP Notes */}
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Director / DP On-Set Notes:
              </label>
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add special instructions, actor cues, sound marks, or camera operator direction..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── On-Set Progress Checklist Accordion ── */}
      <div className="px-3.5 py-2.5 bg-slate-950/85 nodrag">
        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
            <span>On-Set Progress Checklist</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {completedChecklistCount}/{checklist.length}
            </span>
            {showChecklist ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
        </button>

        {showChecklist && (
          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-slate-800">
            {checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer text-xs text-slate-300 select-none group"
              >
                <input
                  type="checkbox"
                  checked={item.isDone}
                  onChange={() => handleToggleChecklistItem(item.id, item.isDone)}
                  className="mt-0.5 accent-indigo-500 rounded cursor-pointer"
                />
                <span className={`flex-1 leading-snug ${item.isDone ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                  {item.task}
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase shrink-0">
                  {item.category}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ShotNode);
