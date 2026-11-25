import { useState } from 'react';
import {
  Settings,
  KeyRound,
  ExternalLink,
  Check,
  Trash2,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Database,
} from 'lucide-react';
import {
  getGeminiApiKey,
  getApiKeySource,
  setGeminiApiKey,
  GEMINI_API_KEY_STORAGE_KEY,
} from '../../services/geminiService';

export default function SettingsModal({ isOpen, onClose, onApiKeySaved }) {
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
    }
    return '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [, setRevision] = useState(0);
  const [saveToast, setSaveToast] = useState('');

  if (!isOpen) return null;

  const source = getApiKeySource();
  const activeKey = getGeminiApiKey();

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setGeminiApiKey(null);
      setRevision((r) => r + 1);
      setSaveToast('Custom key cleared');
    } else {
      setGeminiApiKey(trimmed);
      setRevision((r) => r + 1);
      setSaveToast('Gemini API key saved securely in localStorage!');
    }
    setTimeout(() => setSaveToast(''), 3000);
    onApiKeySaved?.();
  };

  const handleClear = () => {
    setGeminiApiKey(null);
    setApiKeyInput('');
    setRevision((r) => r + 1);
    setSaveToast('Custom key cleared from local storage.');
    setTimeout(() => setSaveToast(''), 3000);
    onApiKeySaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40">
              <Settings className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">
                FilmDot Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure your Gemini API key & local storage preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Active API Key Status</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {source === 'localStorage' && (
                    <span className="text-emerald-400 flex items-center gap-1 font-sans">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active (Custom Key in Local Storage)
                    </span>
                  )}
                  {source === 'env' && (
                    <span className="text-sky-400 flex items-center gap-1 font-sans">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      Active (Environment Fallback .env)
                    </span>
                  )}
                  {source === 'none' && (
                    <span className="text-amber-400 flex items-center gap-1 font-sans">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      No API Key Configured
                    </span>
                  )}
                </div>
              </div>
            </div>

            {activeKey && (
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {activeKey.slice(0, 6)}...{activeKey.slice(-4)}
              </span>
            )}
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <span className="text-[10px] text-slate-500 font-normal lowercase">free from Google AI Studio</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  source === 'env'
                    ? 'Using .env fallback — paste a custom key to override'
                    : 'Paste your Gemini API key (AIzaSy...)'
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 pr-20 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded"
                  title={showPassword ? 'Hide Key' : 'Show Key'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Actions for API Key */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Key to LocalStorage</span>
              </button>

              {source === 'localStorage' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Remove custom key"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Custom Key</span>
                </button>
              )}
            </div>

            {saveToast && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>{saveToast}</span>
              </div>
            )}
          </div>

          {/* Guide Card: How to get a free API key */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-indigo-200">
                  Need a free Gemini API key?
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Google AI Studio offers a free-tier Gemini API key with generous limits. No credit card is required.
                </p>
              </div>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 hover:border-indigo-400 text-indigo-200 hover:text-white text-xs font-medium transition-all group"
            >
              <span>Get Free Key from Google AI Studio</span>
              <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Security & Privacy Guarantee */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-300">Privacy & Security: </strong>
              Your API key is stored exclusively in your browser's <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">localStorage</code> and transmitted directly to Google's official Gemini endpoint. It is never logged, sent to external proxy servers, or stored remotely.
            </p>
          </div>

          {/* Dexie & Offline Info */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-[11px] text-slate-400">
            <Database className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-300">Offline PWA Storage: </strong>
              All shot sequences, canvas drawings, and checklists are saved offline locally in IndexedDB using Dexie.js. You can continue sketching, directing, and tracking takes even without internet connectivity.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
