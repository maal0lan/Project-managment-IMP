import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import api from '../api/client';
import { DashboardStats } from '../types';
import { StatusBadge, PriorityBadge } from '../components/Badges';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
        {error || 'Failed to load dashboard'}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgLight: 'bg-indigo-50',
    },
    {
      title: 'Projects In Progress',
      value: stats.projectsInProgress,
      icon: TrendingUp,
      color: 'bg-sky-500',
      textColor: 'text-sky-600',
      bgLight: 'bg-sky-50',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-violet-500',
      textColor: 'text-violet-600',
      bgLight: 'bg-violet-50',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckSquare,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgLight: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time project tracking and performance statistics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition inline-flex items-center gap-2"
          >
            Manage Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg ${kpi.bgLight} ${kpi.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Completion Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Project Health</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {stats.breakdown.projects.completionRate}% Done
            </span>
          </h2>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.breakdown.projects.completionRate}%` }}
            ></div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="font-semibold text-slate-900">
                {stats.breakdown.projects.completed}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> In Progress
              </span>
              <span className="font-semibold text-slate-900">
                {stats.breakdown.projects.inProgress}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Not Started
              </span>
              <span className="font-semibold text-slate-900">
                {stats.breakdown.projects.notStarted}
              </span>
            </div>
          </div>
        </div>

        {/* Task Completion Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Task Completion</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {stats.breakdown.tasks.completionRate}% Done
            </span>
          </h2>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.breakdown.tasks.completionRate}%` }}
            ></div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="font-semibold text-slate-900">{stats.completedTasks}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> In Progress
              </span>
              <span className="font-semibold text-slate-900">
                {stats.breakdown.tasks.inProgress}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending
              </span>
              <span className="font-semibold text-slate-900">{stats.pendingTasks}</span>
            </div>
          </div>
        </div>

        {/* Task Priority Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Task Priority Breakdown</h2>
          <div className="space-y-4 text-sm mt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span className="text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Priority
                </span>
                <span>{stats.breakdown.tasks.priority.high} tasks</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalTasks ? (stats.breakdown.tasks.priority.high / stats.totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span className="text-sky-600">Medium Priority</span>
                <span>{stats.breakdown.tasks.priority.medium} tasks</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalTasks ? (stats.breakdown.tasks.priority.medium / stats.totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span className="text-slate-600">Low Priority</span>
                <span>{stats.breakdown.tasks.priority.low} tasks</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-slate-400 h-2 rounded-full"
                  style={{
                    width: `${stats.totalTasks ? (stats.breakdown.tasks.priority.low / stats.totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects & Recent Tasks Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Projects</h2>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>
          {stats.recentProjects.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No projects yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition"
                >
                  <div className="overflow-hidden pr-3">
                    <p className="text-sm font-semibold text-slate-800 truncate">{project.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={project.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Tasks</h2>
            <Link to="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>
          {stats.recentTasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No tasks yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition"
                >
                  <div className="overflow-hidden pr-3">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{task.project?.name}</span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
