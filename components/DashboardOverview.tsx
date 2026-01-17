
import React, { useState, useRef } from 'react';
import { Group, GroupSummary } from '../types';
import { ATTENDANCE_DATES } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { analyzeGlobalAttendance } from '../geminiService';

interface DashboardOverviewProps {
  groups: Group[];
  onSelectGroup: (id: string) => void;
  onImport: (file: File) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ groups, onSelectGroup, onImport }) => {
  const [globalAnalysis, setGlobalAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine the actual last session date based on data
  const getLastSessionDate = () => {
    // Iterate backwards through dates
    for (let i = ATTENDANCE_DATES.length - 1; i >= 0; i--) {
      const date = ATTENDANCE_DATES[i];
      // Check if any group has any attendance marked for this date
      const hasData = groups.some(g => 
        Object.values(g.attendance).some(m => m[date] !== undefined && m[date] !== null)
      );
      if (hasData) return date;
    }
    return ATTENDANCE_DATES[0];
  };

  const lastDate = getLastSessionDate();

  const summaries: GroupSummary[] = groups.map(group => {
    let totalPossible = 0;
    let totalPresent = 0;
    let lastSessionPresent = 0;
    
    group.members.forEach(member => {
      ATTENDANCE_DATES.forEach(date => {
        const status = group.attendance[member.id]?.[date];
        if (status) {
          totalPossible++;
          if (status === 'P') totalPresent++;
        }
      });
      if (group.attendance[member.id]?.[lastDate] === 'P') lastSessionPresent++;
    });

    return {
      groupId: group.id,
      groupName: group.name,
      totalMembers: group.members.length,
      avgAttendance: totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0,
      lastSessionAttendance: group.members.length > 0 ? (lastSessionPresent / group.members.length) * 100 : 0
    };
  });

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const avgOverall = summaries.length > 0 ? summaries.reduce((acc, s) => acc + s.avgAttendance, 0) / summaries.length : 0;

  const chartData = summaries.map(s => ({ name: s.groupName, value: s.totalMembers }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7'];

  const handleGlobalAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeGlobalAttendance(groups, ATTENDANCE_DATES);
    setGlobalAnalysis(result);
    setIsAnalyzing(false);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Organization Overview</h2>
          <p className="text-slate-500">Consolidated reports across {groups.length} groups</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={triggerFileUpload}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <i className="fas fa-file-csv text-green-600"></i>
            Import Data
          </button>
          <button 
            onClick={handleGlobalAnalysis}
            disabled={isAnalyzing}
            className="bg-slate-900 text-white hover:bg-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-network-wired text-purple-400'}`}></i>
            {isAnalyzing ? 'Generating Report...' : 'Generate Executive Report'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
            <i className="fas fa-layer-group"></i>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Groups</p>
            <h3 className="text-3xl font-bold text-slate-900">{groups.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Members</p>
            <h3 className="text-3xl font-bold text-slate-900">{totalMembers}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 text-amber-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
            <i className="fas fa-chart-line"></i>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg Attendance</p>
            <h3 className="text-3xl font-bold text-slate-900">{avgOverall.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Analysis */}
        <div className="xl:col-span-2 space-y-6">
          {/* AI Report Section */}
          {globalAnalysis && (
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-6 rounded-2xl shadow-xl border border-slate-700 animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-4">
                 <div className="bg-purple-500/20 text-purple-300 p-2 rounded-lg">
                   <i className="fas fa-robot text-xl"></i>
                 </div>
                 <h3 className="text-lg font-bold">Executive Summary</h3>
               </div>
               <div className="prose prose-invert prose-sm max-w-none">
                 <div className="whitespace-pre-wrap leading-relaxed opacity-90">{globalAnalysis}</div>
               </div>
             </div>
          )}

          {/* Group Performance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <i className="fas fa-list-check text-slate-400"></i>
                Group Performance
              </h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                Last Session: {lastDate}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 bg-slate-50/50">
                    <th className="text-left py-4 px-6 font-bold uppercase text-xs tracking-wider">Group Name</th>
                    <th className="text-center py-4 px-6 font-bold uppercase text-xs tracking-wider">Members</th>
                    <th className="text-center py-4 px-6 font-bold uppercase text-xs tracking-wider">Avg. %</th>
                    <th className="text-center py-4 px-6 font-bold uppercase text-xs tracking-wider">Last Session</th>
                    <th className="text-right py-4 px-6 font-bold uppercase text-xs tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaries.map(s => (
                    <tr key={s.groupId} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6 font-semibold text-slate-900">{s.groupName}</td>
                      <td className="py-4 px-6 text-center text-slate-600 font-medium">{s.totalMembers}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block w-16 py-1 rounded-md text-xs font-bold ${
                          s.avgAttendance >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                          s.avgAttendance >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {s.avgAttendance.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                         <span className={`font-medium ${s.lastSessionAttendance < 50 ? 'text-rose-500' : 'text-slate-600'}`}>
                           {s.lastSessionAttendance.toFixed(0)}%
                         </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => onSelectGroup(s.groupId)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          OPEN <i className="fas fa-arrow-right ml-1"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Visuals */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-chart-pie text-slate-400"></i>
            Distribution
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600, color: '#334155' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 text-center">
            Distribution of members across {groups.length} groups.
          </div>
        </div>

      </div>
    </div>
  );
};
