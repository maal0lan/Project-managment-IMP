import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api/client';
import { dataStore } from '../api/dataStore';
import { Project, ProjectStatus } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (project: Project) => void;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  projectToEdit,
}) => {
  const [name, setName] = useState(projectToEdit?.name || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(projectToEdit?.status || 'NOT_STARTED');
  const [startDate, setStartDate] = useState(
    projectToEdit?.startDate ? projectToEdit.startDate.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    projectToEdit?.endDate ? projectToEdit.endDate.slice(0, 10) : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || '');
      setStatus(projectToEdit.status);
      setStartDate(projectToEdit.startDate ? projectToEdit.startDate.slice(0, 10) : '');
      setEndDate(projectToEdit.endDate ? projectToEdit.endDate.slice(0, 10) : '');
    } else {
      setName('');
      setDescription('');
      setStatus('NOT_STARTED');
      setStartDate('');
      setEndDate('');
    }
    setError(null);
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };

      let savedProject: Project;
      try {
        if (projectToEdit) {
          const res = await api.put(`/projects/${projectToEdit.id}`, payload);
          savedProject = res.data.data;
        } else {
          const res = await api.post('/projects', payload);
          savedProject = res.data.data;
        }
      } catch {
        // Direct local dataStore fallback for standalone Vercel frontend
        if (projectToEdit) {
          savedProject = dataStore.updateProject(projectToEdit.id, payload);
        } else {
          savedProject = dataStore.createProject(payload);
        }
      }

      onSaved(savedProject);
      onClose();
    } catch (err: any) {
      setError(
        err.message || 'Failed to save project'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile Banking App"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe goals, milestones, or scope..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
