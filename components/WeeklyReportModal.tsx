
import React, { useState, useEffect } from 'react';
import { Group } from '../types';
import { analyzeWeeklyReport } from '../geminiService';

interface WeeklyReportModalProps {
  groups: Group[];
  date: string;
  onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ groups, date, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      const res = await analyzeWeeklyReport(groups, date);
      setAnalysis(res);
      setLoading(false);
    };
    fetchAnalysis();
  }, [groups, date]);

  const stats = groups.map(g => {
    let present = 0;
    let absent = 0;
    g.members.forEach(m => {
      const s = g.attendance[m.id]?.[date];
      if (s === 'P') present++;
      else if (s === 'A') absent++;
    });
    return {
      name: g.name,
      present,
      absent,
      total: g.members.length,
      percent: g.members.length > 0 ? (present / g.members.length) * 100 : 0
    };
  }).sort((a, b) => b.percent - a.percent);

  const totalPresent = stats.reduce((acc, s) => acc + s.present, 0);
  const totalAbsent = stats.reduce((acc, s) => acc + s.absent, 0);
  const totalPossible = stats.reduce((acc, s) => acc + s.total, 0);
  const overallRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <i className="fas fa-calendar-week text-blue-400"></i>
              Weekly Performance Report
            </h2>
            <p className="text-slate-400 font-medium">Session Date: <span className="text-blue-300">{date}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Attendance</p>
              <h3 className="text-4xl font-black text-slate-900">{overallRate.toFixed(1)}%</h3>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Total Present</p>
              <h3 className="text-4xl font-black text-emerald-700">{totalPresent}</h3>
            </div>
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
              <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Total Absent</p>
              <h3 className="text-4xl font-black text-rose-700">{totalAbsent}</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Engagement Base</p>
              <h3 className="text-4xl font-black text-blue-700">{totalPossible}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* AI Insights Section */}
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-robot text-purple-600"></i>
                AI Analysis & Strategy
              </h4>
              <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100 min-h-[300px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-purple-400 space-y-4 py-20">
                    <i className="fas fa-circle-notch fa-spin text-4xl"></i>
                    <p className="font-bold animate-pulse">Consulting Gemini for weekly trends...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-purple max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                      {analysis}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ranking Table */}
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-trophy text-amber-500"></i>
                Group Rankings
              </h4>
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                      <th className="py-4 px-6 font-black uppercase text-[10px] tracking-widest">Rank</th>
                      <th className="py-4 px-6 font-black uppercase text-[10px] tracking-widest">Group</th>
                      <th className="py-4 px-6 font-black uppercase text-[10px] tracking-widest text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.map((s, idx) => (
                      <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700">{s.name}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-black ${
                            s.percent >= 80 ? 'text-emerald-600' : 
                            s.percent >= 50 ? 'text-slate-600' : 'text-rose-600'
                          }`}>
                            {s.percent.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <i className="fas fa-print"></i>
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
};
