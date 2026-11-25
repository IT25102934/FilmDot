import { Search, Bell, User, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TopBar({ title }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-cinema-surface border-b border-cinema-border">
      {/* Title */}
      <h1 className="text-cinema-heading font-display font-semibold text-lg">
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="input-field pl-9 pr-4 py-1.5 w-56 text-sm"
          />
        </div>

        {/* Online status */}
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
          isOnline
            ? 'text-reel-emerald bg-reel-emerald/10'
            : 'text-reel-amber bg-reel-amber/10'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <button className="btn-ghost relative p-2">
          <Bell className="w-5 h-5" />
        </button>

        {/* User avatar */}
        <button className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <User className="w-4 h-4 text-accent-light" />
        </button>
      </div>
    </header>
  );
}
