
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AttendanceStats } from '../types';

interface StatsPanelProps {
  data: AttendanceStats[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <i className="fas fa-chart-line text-blue-600"></i>
        Attendance Trends
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" fontSize={10} tickMargin={10} />
            <YAxis fontSize={12} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Bar dataKey="presentCount" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absentCount" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
