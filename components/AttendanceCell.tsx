import React from 'react';
import { AttendanceStatus } from '../types';

interface AttendanceCellProps {
  status: AttendanceStatus;
  onClick: () => void;
}

export const AttendanceCell: React.FC<AttendanceCellProps> = ({ status, onClick }) => {
  const getStyles = () => {
    switch (status) {
      case 'P':
        return 'bg-emerald-500 text-white border-transparent shadow-inner';
      case 'A':
        return 'bg-rose-500 text-white border-transparent shadow-inner';
      default:
        return 'bg-slate-50/30 text-slate-300 border-slate-100 hover:bg-slate-100/50 hover:border-slate-200';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full h-full min-h-[48px] border flex items-center justify-center transition-all duration-300 font-black text-xs ${getStyles()}`}
    >
      {status === 'P' ? <i className="fas fa-check"></i> : status === 'A' ? <i className="fas fa-xmark"></i> : <span className="opacity-0">-</span>}
    </button>
  );
};