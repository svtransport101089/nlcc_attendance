
import React, { useState, useRef, useMemo } from 'react';
import { Group, GroupSummary, Activity } from '../types';
import { ATTENDANCE_DATES } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { analyzeGlobalAttendance } from '../geminiService';

interface DashboardOverviewProps {
  groups: Group[];
  activities: Activity[];
  onSelectGroup: (id: string) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onUndo: (id: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ groups, activities, onSelectGroup, onImport, onExport, onUndo }) => {
  const [globalAnalysis, setGlobalAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Added useMemo to the imports to resolve the 'Cannot find name useMemo' error
  const lastDate = useMemo(() => {
    for (let i = ATTENDANCE_DATES.length - 1; i >= 0; i--) {
      const date = ATTENDANCE_DATES[i];
      if (groups.some(g => Object.values(g.attendance).some(m => m[date]))) return date;
    }
    return ATTENDANCE_DATES[0];
  }, [groups]);

  const summaries: GroupSummary[] = groups.map(group => {
    let totalPossible = 0, totalPresent = 0, lastSessionPresent = 0;
    group.members.forEach(member => {
      ATTENDANCE_DATES.forEach(date => {
        const status = group.attendance[member.id]?.[date];
        if (status) { totalPossible++; if (status === 'P') totalPresent++; }
      });
      if (group.attendance[member.id]?.[lastDate] === 'P') lastSessionPresent++;
    });
    return { groupId: group.id, groupName: group.name, totalMembers: group.members.length, avgAttendance: totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0, lastSessionAttendance: group.members.length > 0 ? (lastSessionPresent / group.members.length) * 100 : 0 };
  });

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const avgOverall = summaries.length > 0 ? summaries.reduce((acc, s) => acc + s.avgAttendance, 0) / summaries.length : 0;
  const chartData = summaries.map(s => ({ name: s.groupName, value: s.totalMembers }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#06b6d4', '#ec4899'];

  const handleGlobalAnalysis = async () => {
    setIsAnalyzing(true);
    setGlobalAnalysis(await analyzeGlobalAttendance(groups, ATTENDANCE_DATES));
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Organization Dashboard</h2>
          <p className="text-slate-500 font-medium">Analytics across {groups.length} groups</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-sm"><i className="fas fa-file-csv text-emerald-600"></i> IMPORT</button>
          <button onClick={onExport} className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-sm"><i className="fas fa-download text-blue-600"></i> EXPORT</button>
          <button onClick={handleGlobalAnalysis} disabled={isAnalyzing} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg disabled:opacity-50"><i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles text-purple-400'}`}></i> AI REPORT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{l: 'Active Groups', v: groups.length, i: 'fa-layer-group', c: 'blue'}, {l: 'Total Members', v: totalMembers, i: 'fa-users', c: 'emerald'}, {l: 'Avg Attendance', v: `${avgOverall.toFixed(1)}%`, i: 'fa-chart-line', c: 'amber'}].map((s, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2rem] border border-slate-200 flex items-center gap-5">
            <div className={`bg-${s.c}-50 text-${s.c}-600 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl`}><i className={`fas ${s.i}`}></i></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p><h3 className="text-3xl font-black">{s.v}</h3></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          {globalAnalysis && (
            <div className="bg-slate-900 text-slate-100 p-8 rounded-[2rem] border border-slate-700">
               <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700">
                 <div className="bg-purple-500/20 text-purple-300 p-2 rounded-lg"><i className="fas fa-robot text-xl"></i></div>
                 <h3 className="text-lg font-black tracking-widest uppercase">Executive Analysis</h3>
               </div>
               <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm">{globalAnalysis}</div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2"><i className="fas fa-ranking-star text-slate-400"></i> PERFORMANCE</h3>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">LAST SESSION: {lastDate}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-left"><th className="py-4 px-8 font-black uppercase text-[10px]">Group</th><th className="py-4 px-8 text-center font-black uppercase text-[10px]">Members</th><th className="py-4 px-8 text-center font-black uppercase text-[10px]">Avg %</th><th className="py-4 px-8 text-right font-black uppercase text-[10px]">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {summaries.map(s => (
                    <tr key={s.groupId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-8 font-bold text-slate-900">{s.groupName}</td>
                      <td className="py-4 px-8 text-center text-slate-500 font-bold">{s.totalMembers}</td>
                      <td className="py-4 px-8 text-center"><span className={`px-3 py-1 rounded-xl text-[10px] font-black ${s.avgAttendance >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{s.avgAttendance.toFixed(0)}%</span></td>
                      <td className="py-4 px-8 text-right"><button onClick={() => onSelectGroup(s.groupId)} className="bg-blue-600 text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase hover:bg-blue-700">Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col h-full">
            <h3 className="text-lg font-black mb-6 flex items-center justify-between">
              <span><i className="fas fa-history text-slate-400 mr-2"></i> RECENT ACTIVITY</span>
              {activities.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{activities.length}</span>}
            </h3>
            <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar space-y-4">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 italic text-sm">No activity yet.</div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="group flex gap-3 items-start border-l-2 border-slate-100 pl-3 relative transition-all hover:border-blue-300">
                    <div className={`w-2 h-2 rounded-full absolute -left-[5px] top-2 ${act.type.includes('ADD') ? 'bg-emerald-500' : act.type.includes('DELETE') ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{act.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <button 
                      onClick={() => onUndo(act.id)} 
                      title="Delete this activity (Undo)"
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <i className="fas fa-trash-can text-xs"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t text-[10px] text-slate-400 font-bold tracking-widest text-center uppercase">Audit Log Persistence Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
};
