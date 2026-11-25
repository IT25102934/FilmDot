import StoryboardCanvas from '../StoryboardCanvas';

export default function CanvasView() {
  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      <div className="mb-4">
        <h2 className="text-2xl font-display font-bold text-cinema-heading">
          Director's Sketchpad
        </h2>
        <p className="text-cinema-muted text-sm mt-1">
          Draw storyboards, sketch camera angles, and overlay reference moodboard images with stylus support.
        </p>
      </div>
      <div className="flex-1 min-h-[560px]">
        <StoryboardCanvas className="h-full" />
      </div>
    </div>
  );
}
