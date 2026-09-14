import React from 'react';
import { ProjectStatus, TaskStatus, TaskPriority } from '../types';

export const StatusBadge: React.FC<{ status: ProjectStatus | TaskStatus }> = ({ status }) => {
  const getBadgeProps = () => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'PENDING':
        return { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'NOT_STARTED':
        return { label: 'Not Started', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const { label, bg } = getBadgeProps();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg}`}>
      {label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const getProps = () => {
    switch (priority) {
      case 'HIGH':
        return { label: 'High Priority', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'MEDIUM':
        return { label: 'Medium', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'LOW':
        return { label: 'Low', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const { label, bg } = getProps();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${bg}`}>
      {label}
    </span>
  );
};
