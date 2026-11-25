import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

const UMAMI_SHARE_URL = 'https://cloud.umami.is/share/cNSfvtoNVPLzfUVZ';

export default function LiveStatsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Live Stats Dashboard"
    >
      <div className="flex flex-col w-full max-w-5xl h-[82vh] rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <h3 className="font-display font-semibold text-white text-sm leading-tight">
                Live Stats
              </h3>
              <p className="text-[11px] text-slate-400">
                Public FilmDot usage &amp; telemetry via Umami
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={UMAMI_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
              aria-label="Close Live Stats modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Iframe Body */}
        <div className="relative flex-1 w-full bg-slate-950">
          <iframe
            src={UMAMI_SHARE_URL}
            title="FilmDot Live Umami Analytics"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
