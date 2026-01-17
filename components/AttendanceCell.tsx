
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
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'A':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-300 border-slate-200 hover:bg-slate-100';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full h-full min-h-[40px] border flex items-center justify-center transition-all duration-200 font-bold ${getStyles()}`}
    >
      {status || '-'}
    </button>
  );
};
