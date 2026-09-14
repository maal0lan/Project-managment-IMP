import React, { useEffect, useState } from 'react';
import { History, Shield, Activity } from 'lucide-react';
import api from '../api/client';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs?limit=40');
        setLogs(res.data.data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.startsWith('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.startsWith('UPDATE')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (action.startsWith('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600" /> Activity Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable audit logs tracking project & task creations, updates, and removals.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No activity recorded yet</h3>
          <p className="text-xs text-slate-400 mt-1">Actions you perform will be recorded here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {logs.map((log) => {
            let detailsObj: any = null;
            try {
              if (log.details) detailsObj = JSON.parse(log.details);
            } catch {
              detailsObj = log.details;
            }

            return (
              <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        Entity: <strong className="text-slate-700">{log.entity}</strong>
                      </span>
                    </div>
                    {detailsObj && (
                      <p className="text-xs text-slate-600 mt-1.5 font-mono bg-slate-50 p-2 rounded border border-slate-100 break-all">
                        {typeof detailsObj === 'object' ? JSON.stringify(detailsObj) : detailsObj}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
