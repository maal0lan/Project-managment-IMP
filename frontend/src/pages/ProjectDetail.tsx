import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';
import api from '../api/client';
import { Project, Task, TaskStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const fetchProjectDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
      setTasks(res.data.data.tasks || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    try {
      const res = await api.put(`/tasks/${task.id}`, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: res.data.data.status } : t))
      );
      // Refresh stats
      fetchProjectDetails();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setDeleteTaskId(null);
      fetchProjectDetails();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      try {
        await api.delete(`/projects/${id}`);
        navigate('/projects');
      } catch (err) {
        console.error('Failed to delete project', err);
      }
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Unable to retrieve project.'}</p>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
      </div>
    );
  }

  const stats = project.stats || { totalTasks: 0, completedTasks: 0, progress: 0 };

  return (
    <div className="space-y-8">
      {/* Back button & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Project
          </button>
          <button
            onClick={handleDeleteProject}
            className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Project
          </button>
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={project.status} />
              <span className="text-xs text-slate-400">
                Created on {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
              {project.description || 'No description provided.'}
            </p>
          </div>

          {/* Progress gauge */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl min-w-[200px] text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Completion Rate
            </span>
            <span className="text-3xl font-black text-indigo-600 mt-1 block">
              {stats.progress}%
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {stats.completedTasks} / {stats.totalTasks} tasks done
            </span>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Date Timeline */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Start Date:{' '}
              <strong className="text-slate-700">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Target End Date:{' '}
              <strong className="text-slate-700">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not specified'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Project Tasks</h2>
            <p className="text-xs text-slate-500">Manage all action items under this project.</p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All Tasks'
                  : st === 'PENDING'
                  ? 'Pending'
                  : st === 'IN_PROGRESS'
                  ? 'In Progress'
                  : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tasks in this view</p>
            <p className="text-xs text-slate-400 mt-1">
              Add a new task or adjust the status filter to see items.
            </p>
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition"
            >
              Add First Task
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTaskStatus(task)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-indigo-600 text-transparent'
                    }`}
                    title="Toggle completion status"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-semibold text-slate-900 truncate ${
                        task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.name}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      {task.dueDate && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setTaskToEdit(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTaskId(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={() => fetchProjectDetails()}
        taskToEdit={taskToEdit}
        defaultProjectId={project.id}
        projects={[project]}
      />

      {/* Project Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSaved={() => fetchProjectDetails()}
        projectToEdit={project}
      />

      {/* Task Delete Confirmation */}
      {deleteTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl text-center">
            <h3 className="text-lg font-bold text-slate-900">Delete Task?</h3>
            <p className="text-xs text-slate-500 mt-1">Are you sure you want to remove this task?</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteTaskId(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteTaskId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
