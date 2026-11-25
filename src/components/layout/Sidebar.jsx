import {
  Film,
  Clapperboard,
  LayoutGrid,
  PenTool,
  GitBranch,
  FolderOpen,
  Settings,
  Plus,
} from 'lucide-react';

const navItems = [
  { icon: Clapperboard, label: 'Projects', id: 'projects' },
  { icon: LayoutGrid, label: 'Storyboard', id: 'storyboard' },
  { icon: GitBranch, label: 'Shot Flow', id: 'shotflow' },
  { icon: PenTool, label: 'Canvas', id: 'canvas' },
  { icon: FolderOpen, label: 'Assets', id: 'assets' },
];

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="flex flex-col w-16 lg:w-56 h-screen bg-cinema-surface border-r border-cinema-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-cinema-border">
        <Film className="w-7 h-7 text-accent" />
        <span className="hidden lg:block text-cinema-heading font-display font-bold text-lg tracking-tight">
          FilmDot
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-3">
        {navItems.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`sidebar-item ${
              activeView === id ? 'active' : ''
            }`}
            title={label}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block text-sm">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-cinema-border space-y-1">
        <button className="sidebar-item w-full" title="New Project">
          <Plus className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block text-sm">New Project</span>
        </button>
        <button className="sidebar-item w-full" title="Settings">
          <Settings className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
}
