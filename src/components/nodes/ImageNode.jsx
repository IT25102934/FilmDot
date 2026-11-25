import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Image as ImageIcon, Link as LinkIcon, Trash2, ExternalLink } from 'lucide-react';

function ImageNode({ id, data }) {
  const {
    imageUrl,
    title = 'Moodboard Reference',
    targetShotId,
    targetScene,
    onDelete,
  } = data;

  return (
    <div className="w-[300px] rounded-xl border border-purple-500/40 bg-slate-900/95 shadow-[0_0_20px_rgba(168,85,247,0.15)] overflow-hidden transition-all hover:border-purple-500/70">
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-slate-900"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1.5 truncate">
          <span className="p-1 rounded bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <ImageIcon className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-semibold text-slate-200 truncate font-display">
            {title}
          </span>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="nodrag p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
            title="Remove Image Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Image Preview */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden group">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="nodrag absolute bottom-2 right-2 p-1 rounded bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Open Full Image"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Footer Connection Metadata */}
      <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-purple-300">
        <div className="flex items-center gap-1">
          <LinkIcon className="w-3 h-3 text-purple-400" />
          <span>Connected to:</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800/60 font-semibold text-purple-200 truncate max-w-[140px]">
          {targetShotId ? `${targetShotId}` : targetScene ? `Scene ${targetScene}` : 'Scene Node'}
        </span>
      </div>
    </div>
  );
}

export default memo(ImageNode);
