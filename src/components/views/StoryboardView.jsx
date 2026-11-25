import { LayoutGrid, Plus, GripVertical } from 'lucide-react';
import { useState } from 'react';

const demoFrames = [
  { id: 1, label: 'EXT. CITY - DAY', notes: 'Establishing wide shot of skyline' },
  { id: 2, label: 'INT. OFFICE - DAY', notes: 'Main character enters frame left' },
  { id: 3, label: 'CU. PROTAGONIST', notes: 'Reaction shot, slow zoom' },
  { id: 4, label: 'OTS. DIALOGUE', notes: 'Over-the-shoulder, shallow DOF' },
];

export default function StoryboardView() {
  const [frames, setFrames] = useState(demoFrames);

  const addFrame = () => {
    const nextId = frames.length + 1;
    setFrames((prev) => [
      ...prev,
      {
        id: nextId,
        label: `SHOT ${String(nextId).padStart(3, '0')}`,
        notes: 'New storyboard frame',
      },
    ]);
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-cinema-heading">
            Storyboard
          </h2>
          <p className="text-cinema-muted text-sm mt-1">
            {frames.length} frames
          </p>
        </div>
        <button onClick={addFrame} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Frame
        </button>
      </div>

      {/* Frames Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            className="panel-card group hover:border-accent/50 transition-colors"
          >
            {/* Frame number & drag handle */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-cinema-border">
              <span className="text-xs font-mono text-accent">
                F{String(index + 1).padStart(3, '0')}
              </span>
              <GripVertical className="w-4 h-4 text-cinema-border cursor-grab" />
            </div>

            {/* Thumbnail area */}
            <div className="aspect-video bg-cinema-bg flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-cinema-border group-hover:text-accent/40 transition-colors" />
            </div>

            {/* Frame info */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-cinema-heading truncate">
                {frame.label}
              </p>
              <p className="text-xs text-cinema-muted mt-1 line-clamp-2">
                {frame.notes}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
