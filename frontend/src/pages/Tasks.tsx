import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/client';
import { dataStore } from '../api/dataStore';
import { Task, Project, TaskStatus, TaskPriority, Pagination } from '../types';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { TaskModal } from '../components/TaskModal';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Load project list for dropdown filter
  useEffect(() => {
    const fetchProjectList = async () => {
      try {
        const res = await api.get('/projects', { params: { limit: 100 } });
        setProjects(res.data.data);
      } catch {
        setProjects(dataStore.getProjects({ limit: 100 }).data);
      }
    };
    fetchProjectList();
  }, []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (projectFilter !== 'ALL') params.projectId = projectFilter;

      try {
        const res = await api.get('/tasks', { params });
        setTasks(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        const local = dataStore.getTasks({
          search,
          status: statusFilter,
          priority: priorityFilter,
          projectId: projectFilter,
          page: pagination.page,
          limit: pagination.limit,
        });
        setTasks(local.data);
        setPagination(local.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
    } catch {
      dataStore.updateTask(task.id, { status: nextStatus });
    }
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
    } catch {
      dataStore.deleteTask(id);
    } finally {
      setDeleteTaskId(null);
      fetchTasks();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            All Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter by status or priority, and update progress across all projects.
          </p>
        </div>
        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search by Name */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search tasks by name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="border border-slate-200 rounded-lg py-2 px-3 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="border border-slate-200 rounded-lg py-2 px-3 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="border border-slate-200 rounded-lg py-2 px-3 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 bg-white">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
              }}
              className="py-2 bg-transparent text-slate-700 text-xs focus:outline-none"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="dueDate:asc">Due Date</option>
              <option value="name:asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No tasks found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tasks match the selected search or filter criteria.'
              : 'Get started by creating your first task.'}
          </p>
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {tasks.map((task) => (
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
                  title="Toggle status"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-semibold text-slate-900 truncate ${
                        task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.name}
                    </h4>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {task.project?.name || 'Unassigned'}
                    </span>
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
                    setIsModalOpen(true);
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

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-sm">
          <span className="text-xs text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} tasks
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => fetchTasks()}
        taskToEdit={taskToEdit}
        projects={projects}
      />

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl text-center">
            <h3 className="text-lg font-bold text-slate-900">Delete Task?</h3>
            <p className="text-xs text-slate-500 mt-1">This will permanently remove this task.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteTaskId(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTaskId)}
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
