import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api/client';
import { dataStore } from '../api/dataStore';
import { Task, TaskPriority, TaskStatus, Project } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
  taskToEdit?: Task | null;
  defaultProjectId?: string;
  projects?: Project[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  taskToEdit,
  defaultProjectId,
  projects = [],
}) => {
  const [name, setName] = useState(taskToEdit?.name || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'PENDING');
  const [projectId, setProjectId] = useState(taskToEdit?.projectId || defaultProjectId || '');
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate ? taskToEdit.dueDate.slice(0, 10) : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (taskToEdit) {
      setName(taskToEdit.name);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setProjectId(taskToEdit.projectId);
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 10) : '');
    } else {
      setName('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('PENDING');
      setProjectId(defaultProjectId || (projects[0]?.id ?? ''));
      setDueDate('');
    }
    setError(null);
  }, [taskToEdit, defaultProjectId, isOpen, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    if (!projectId) {
      setError('Please select a project');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        priority,
        status,
        projectId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      let savedTask: Task;
      try {
        if (taskToEdit) {
          const res = await api.put(`/tasks/${taskToEdit.id}`, payload);
          savedTask = res.data.data;
        } else {
          const res = await api.post('/tasks', payload);
          savedTask = res.data.data;
        }
      } catch {
        if (taskToEdit) {
          savedTask = dataStore.updateTask(taskToEdit.id, payload);
        } else {
          savedTask = dataStore.createTask(payload);
        }
      }

      onSaved(savedTask);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
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
              Task Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Implement OAuth login"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!!taskToEdit || (!!defaultProjectId && projects.length <= 1)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white disabled:bg-slate-100"
            >
              {projects.length > 0 ? (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option value={projectId}>Current Project</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details or acceptance criteria..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
