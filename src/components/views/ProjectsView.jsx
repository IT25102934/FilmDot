import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Film, Clock, MoreVertical } from 'lucide-react';
import db from '../../db';

export default function ProjectsView() {
  const projects = useLiveQuery(() => db.projects.toArray());

  const createProject = async () => {
    const now = new Date().toISOString();
    await db.projects.add({
      title: `Untitled Project ${(projects?.length || 0) + 1}`,
      description: '',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-cinema-heading">
            Your Projects
          </h2>
          <p className="text-cinema-muted text-sm mt-1">
            {projects?.length || 0} project{projects?.length !== 1 ? 's' : ''} &middot; stored locally
          </p>
        </div>
        <button onClick={createProject} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <div
            key={project.id}
            className="panel-card p-4 hover:border-accent/50 transition-colors cursor-pointer group"
          >
            {/* Thumbnail placeholder */}
            <div className="aspect-video rounded-md bg-cinema-surface mb-3 flex items-center justify-center">
              <Film className="w-10 h-10 text-cinema-border group-hover:text-accent transition-colors" />
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-cinema-heading text-sm">
                  {project.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-cinema-muted">
                  <Clock className="w-3 h-3" />
                  {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Status badge */}
            <div className="mt-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                project.status === 'active'
                  ? 'bg-reel-emerald/10 text-reel-emerald'
                  : project.status === 'complete'
                  ? 'bg-accent/10 text-accent-light'
                  : 'bg-cinema-surface text-cinema-muted'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {(!projects || projects.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-cinema-muted">
            <Film className="w-16 h-16 mb-4 text-cinema-border" />
            <p className="text-lg font-medium text-cinema-heading mb-1">
              No projects yet
            </p>
            <p className="text-sm mb-4">
              Create your first project to get started
            </p>
            <button onClick={createProject} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
