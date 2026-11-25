import { FolderOpen, Upload, Image, FileVideo, FileAudio } from 'lucide-react';

export default function AssetsView() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-cinema-heading">
            Assets
          </h2>
          <p className="text-cinema-muted text-sm mt-1">
            Manage project media files
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-2xl bg-cinema-card border border-cinema-border flex items-center justify-center mb-4">
          <FolderOpen className="w-10 h-10 text-cinema-border" />
        </div>
        <p className="text-lg font-medium text-cinema-heading mb-1">
          No assets yet
        </p>
        <p className="text-sm text-cinema-muted mb-6 text-center max-w-sm">
          Upload images, video clips, and audio files to use in your storyboards and projects.
        </p>

        {/* Supported formats */}
        <div className="flex gap-4 text-cinema-muted">
          <div className="flex items-center gap-1.5 text-xs">
            <Image className="w-4 h-4" /> Images
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <FileVideo className="w-4 h-4" /> Video
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <FileAudio className="w-4 h-4" /> Audio
          </div>
        </div>
      </div>
    </div>
  );
}
