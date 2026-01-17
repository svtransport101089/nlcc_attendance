
export interface Member {
  id: string;
  name: string;
  phone: string;
}

export type AttendanceStatus = 'P' | 'A' | null;

export interface AttendanceData {
  [memberId: string]: {
    [date: string]: AttendanceStatus;
  };
}

export interface Group {
  id: string;
  name: string;
  leader: string;
  coLeader: string;
  period: string;
  members: Member[];
  attendance: AttendanceData;
}

export interface AttendanceStats {
  date: string;
  presentCount: number;
  absentCount: number;
  total: number;
}

export interface GroupSummary {
  groupId: string;
  groupName: string;
  totalMembers: number;
  avgAttendance: number;
  lastSessionAttendance: number;
}
