import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  INITIAL_GROUPS,
  ATTENDANCE_DATES, 
  MONTH_HEADERS 
} from './constants';
import { Group, AttendanceStatus, AttendanceStats, Member, AttendanceData, Activity } from './types';
import { AttendanceCell } from './components/AttendanceCell';
import { StatsPanel } from './components/StatsPanel';
import { DashboardOverview } from './components/DashboardOverview';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { analyzeAttendance } from './geminiService';
import { 
  fetchGroupsFromDb, 
  updateAttendanceInDb, 
  addGroupToDb, 
  updateGroupMembersInDb, 
  deleteMemberFromDb,
  batchImportGroupsToDb,
  fetchActivitiesFromDb,
  logActivityToDb,
  deleteActivityFromDb
} from './dataService';

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | 'dashboard'>('Daniel');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Member CRUD State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '' });
  
  // Group CRUD State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', leader: '', id: '' });

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        const [dbGroups, dbActivities] = await Promise.all([
          fetchGroupsFromDb(),
          fetchActivitiesFromDb()
        ]);
        // If the database has groups, use them, otherwise use initial defaults
        setGroups(dbGroups.length > 0 ? dbGroups : INITIAL_GROUPS);
        setActivities(dbActivities);
      } catch (error) {
        console.error("Critical: Local synchronization failed:", error);
        setGroups(INITIAL_GROUPS);
      } finally {
        // Small delay to ensure smooth transition from loader to app
        setTimeout(() => setLoading(false), 300);
      }
    };
    initData();
  }, []);

  const activeGroup = useMemo(() => 
    groups.find(g => g.id === activeGroupId)
  , [groups, activeGroupId]);

  const recordActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `act_${Date.now()}`,
      timestamp: Date.now()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
    await logActivityToDb(newActivity);
  };

  const handleRevertActivity = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    try {
      if (activity.type === 'ATTENDANCE_CHANGE') {
        const { memberId, date, previousStatus } = activity.revertData;
        await updateAttendanceInDb(activity.groupId, memberId, date, previousStatus);
        setGroups(prev => prev.map(g => g.id === activity.groupId ? {
          ...g,
          attendance: { ...g.attendance, [memberId]: { ...g.attendance[memberId], [date]: previousStatus } }
        } : g));
      } else if (activity.type === 'MEMBER_ADD') {
        const memberId = activity.revertData.memberId;
        const group = groups.find(g => g.id === activity.groupId);
        if (group) {
          const updatedMembers = group.members.filter(m => m.id !== memberId);
          await updateGroupMembersInDb(activity.groupId, updatedMembers);
          setGroups(prev => prev.map(g => g.id === activity.groupId ? { ...g, members: updatedMembers } : g));
        }
      } else if (activity.type === 'MEMBER_DELETE') {
        const { member, previousMembers } = activity.revertData;
        await updateGroupMembersInDb(activity.groupId, previousMembers);
        setGroups(prev => prev.map(g => g.id === activity.groupId ? { ...g, members: previousMembers } : g));
      } else if (activity.type === 'MEMBER_EDIT') {
        const { previousMember } = activity.revertData;
        const group = groups.find(g => g.id === activity.groupId);
        if (group) {
          const updatedMembers = group.members.map(m => m.id === previousMember.id ? previousMember : m);
          await updateGroupMembersInDb(activity.groupId, updatedMembers);
          setGroups(prev => prev.map(g => g.id === activity.groupId ? { ...g, members: updatedMembers } : g));
        }
      }

      setActivities(prev => prev.filter(a => a.id !== activityId));
      await deleteActivityFromDb(activityId);
    } catch (error) {
      console.error("Undo failed:", error);
    }
  };

  const toggleAttendance = useCallback(async (memberId: string, date: string) => {
    if (!activeGroupId || activeGroupId === 'dashboard' || !activeGroup) return;

    const current = activeGroup.attendance[memberId]?.[date];
    let next: AttendanceStatus = 'P';
    if (current === 'P') next = 'A';
    else if (current === 'A') next = null;

    setGroups(prev => prev.map(g => g.id === activeGroupId ? {
      ...g,
      attendance: {
        ...g.attendance,
        [memberId]: { ...(g.attendance[memberId] || {}), [date]: next }
      }
    } : g));

    try {
      await updateAttendanceInDb(activeGroupId, memberId, date, next);
      const member = activeGroup.members.find(m => m.id === memberId);
      await recordActivity({
        type: 'ATTENDANCE_CHANGE',
        groupId: activeGroupId,
        description: `Set ${member?.name} as ${next || 'Unmarked'} (${date})`,
        revertData: { memberId, date, previousStatus: current }
      });
    } catch (error) {
      console.error("Update failed:", error);
    }
  }, [activeGroupId, activeGroup]);

  const groupStats: AttendanceStats[] = useMemo(() => {
    if (!activeGroup) return [];
    return ATTENDANCE_DATES.map(date => {
      let present = 0;
      let absent = 0;
      activeGroup.members.forEach(m => {
        const status = activeGroup.attendance[m.id]?.[date];
        if (status === 'P') present++;
        else if (status === 'A') absent++;
      });
      return {
        date,
        presentCount: present,
        absentCount: absent,
        total: activeGroup.members.length
      };
    });
  }, [activeGroup]);

  const handleRunAnalysis = async () => {
    if (!activeGroup) return;
    setIsAnalyzing(true);
    const result = await analyzeAttendance(activeGroup.members, activeGroup.attendance, ATTENDANCE_DATES);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleGlobalExport = () => {
    const dateHeaders = ATTENDANCE_DATES.map(d => {
      const [day, month, year] = d.split('-');
      return `${year}-${month}-${day}`; 
    });
    const headers = ['Group_Name', 'Group_Id', 'Leader', 'Co_Leader', 'Period', 'Member_Name', 'Phone', ...dateHeaders];
    const rows = [headers.join(',')];
    groups.forEach(g => {
      g.members.forEach(m => {
        const row = [
          `"${g.name}"`, `"${g.id}"`, `"${g.leader}"`, `"${g.coLeader || ''}"`, `"${g.period}"`, `"${m.name}"`, `"${m.phone || ''}"`, ...ATTENDANCE_DATES.map(date => g.attendance[m.id]?.[date] || '')
        ];
        rows.push(row.join(','));
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ProAttend_Full_Export.csv`;
    link.click();
  };

  const handleGlobalImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headerRow = lines[0].split(',');
    const parsedGroups: Record<string, Group> = {};
    const dateIndices: Record<string, number> = {};
    
    headerRow.forEach((col, idx) => {
      const cleanCol = col.trim().replace(/"/g, '');
      if (cleanCol.match(/\d{4}-\d{2}-\d{2}/)) {
        const [y, m, d] = cleanCol.split('-');
        dateIndices[`${d}-${m}-${y}`] = idx;
      }
    });

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim().replace(/"/g, '')); 
      if (cols.length < 5) continue;
      
      const groupName = cols[0];
      const groupId = cols[1];
      const leader = cols[2];
      const memberName = cols[5];
      if (!groupId || !memberName) continue;

      if (!parsedGroups[groupId]) {
        parsedGroups[groupId] = { id: groupId, name: groupName, leader: leader || 'Unknown', coLeader: cols[3] || '', period: cols[4] || 'JANUARY 2026 - APRIL 2026', members: [], attendance: {} };
      }
      const memberId = `${groupId}_${parsedGroups[groupId].members.length + 1}`;
      parsedGroups[groupId].members.push({ id: memberId, name: memberName, phone: cols[6] || '' });
      const memberAtt: Record<string, AttendanceStatus> = {};
      Object.entries(dateIndices).forEach(([dateStr, colIdx]) => {
        const val = cols[colIdx];
        memberAtt[dateStr] = val === 'P' ? 'P' : val === 'A' ? 'A' : null;
      });
      parsedGroups[groupId].attendance[memberId] = memberAtt;
    }

    const newGroupList = Object.values(parsedGroups);
    if (newGroupList.length > 0) {
      setGroups(newGroupList);
      await batchImportGroupsToDb(newGroupList);
      alert(`Imported ${newGroupList.length} groups.`);
    }
  };

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ name: '', phone: '' });
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !activeGroup) return;
    
    let updatedMembers = [...activeGroup.members];
    const isNew = !editingMember;
    const newId = isNew ? `mem_${Date.now()}` : editingMember!.id;

    if (isNew) {
      updatedMembers.push({ id: newId, name: memberForm.name, phone: memberForm.phone || '' });
    } else {
      updatedMembers = updatedMembers.map(m => m.id === newId ? { ...m, ...memberForm } : m);
    }

    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, members: updatedMembers } : g));
    await updateGroupMembersInDb(activeGroupId, updatedMembers);
    
    await recordActivity({
      type: isNew ? 'MEMBER_ADD' : 'MEMBER_EDIT',
      groupId: activeGroupId,
      description: `${isNew ? 'Added' : 'Updated'} member ${memberForm.name}`,
      revertData: isNew ? { memberId: newId } : { previousMember: editingMember }
    });

    setShowMemberModal(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm("Delete member permanently?") || !activeGroup) return;
    const member = activeGroup.members.find(m => m.id === memberId);
    const updatedMembers = activeGroup.members.filter(m => m.id !== memberId);
    
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, members: updatedMembers } : g));
    await deleteMemberFromDb(activeGroupId, memberId, updatedMembers);
    
    await recordActivity({
      type: 'MEMBER_DELETE',
      groupId: activeGroupId,
      description: `Removed member ${member?.name}`,
      revertData: { member, previousMembers: activeGroup.members }
    });
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name || !newGroup.id) return;
    const group: Group = { id: newGroup.id, name: newGroup.name, leader: newGroup.leader || 'Daniel', coLeader: '', period: 'JANUARY 2026 - APRIL 2026', members: [], attendance: {} };
    setGroups(prev => [...prev, group]);
    await addGroupToDb(group);
    await recordActivity({ type: 'GROUP_ADD', groupId: group.id, description: `Created group ${group.name}`, revertData: { groupId: group.id } });
    setShowAddGroupModal(false);
    setActiveGroupId(group.id);
  };

  const latestDate = useMemo(() => {
    for (let i = ATTENDANCE_DATES.length - 1; i >= 0; i--) {
      const date = ATTENDANCE_DATES[i];
      if (groups.some(g => Object.values(g.attendance).some(m => m[date]))) return date;
    }
    return ATTENDANCE_DATES[0];
  }, [groups]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
        <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse shadow-xl">
          <i className="fas fa-calendar-check text-2xl"></i>
        </div>
        <div className="text-center">
          <p className="font-black text-slate-800 text-lg tracking-tight">ProAttend</p>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Synchronizing local data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 sticky top-0 z-[60] shadow-sm">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveGroupId('dashboard')}>
              <div className="bg-slate-900 text-white w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm"><i className="fas fa-calendar-check"></i></div>
              <span className="font-black text-xl tracking-tighter">ProAttend</span>
            </div>
            <div className="hidden lg:flex gap-1 items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              <button onClick={() => setActiveGroupId('dashboard')} className={`px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${activeGroupId === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Overview</button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <div className="flex gap-1 overflow-x-auto max-w-[500px] no-scrollbar">
                {groups.map(g => (
                  <button key={g.id} onClick={() => setActiveGroupId(g.id)} className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase whitespace-nowrap transition-all ${activeGroupId === g.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>{g.name}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowWeeklyReport(true)} className="hidden md:flex bg-amber-50 text-amber-600 border border-amber-200/50 px-5 py-2 rounded-2xl text-[10px] font-black items-center gap-2 hover:bg-amber-100 transition-all"><i className="fas fa-flag-checkered"></i> REPORT</button>
             <button onClick={() => setShowAddGroupModal(true)} className="w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center"><i className="fas fa-plus text-lg"></i></button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-6 lg:p-10">
        {activeGroupId === 'dashboard' ? (
          <DashboardOverview 
            groups={groups} 
            activities={activities}
            onSelectGroup={setActiveGroupId} 
            onImport={handleGlobalImport}
            onExport={handleGlobalExport}
            onUndo={handleRevertActivity}
          />
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{activeGroup?.name}</h2>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">Active Node</span>
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Leader: {activeGroup?.leader} • Period: {activeGroup?.period}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={openAddMember} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"><i className="fas fa-user-plus"></i> Add Member</button>
                <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 hover:bg-black disabled:opacity-50 shadow-xl"><i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles text-purple-400'}`}></i> AI Assessment</button>
                {activities.some(a => a.groupId === activeGroupId) && (
                   <button onClick={() => handleRevertActivity(activities.find(a => a.groupId === activeGroupId)!.id)} className="bg-rose-50 text-rose-600 border border-rose-200/50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 hover:bg-rose-100 transition-all shadow-sm"><i className="fas fa-undo"></i> Undo</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <StatsPanel data={groupStats} />
              </div>
              <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2.5 text-slate-400 mb-6"><i className="fas fa-brain text-purple-600"></i> AI Audit</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {analysis ? (
                    <div className="prose prose-slate prose-sm max-w-none">
                      <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-sm">{analysis}</div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200"><i className="fas fa-robot text-xl"></i></div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Run AI Assessment to see insights.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-50/50 sticky top-0 z-20">
                    <tr>
                      <th className="p-5 text-left sticky left-0 bg-slate-50 z-30 border-r border-slate-200/60 min-w-[280px] font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Registry</th>
                      {MONTH_HEADERS.map(month => <th key={month.name} colSpan={month.span} className="p-3 text-center border-l border-slate-200/60 font-black text-slate-300 text-[9px] tracking-[0.3em] uppercase">{month.name}</th>)}
                    </tr>
                    <tr>
                      <th className="p-5 text-left sticky left-0 bg-slate-50 z-30 border-r border-slate-200/60 text-[11px] font-black text-slate-900 tracking-tight">Name & Contact</th>
                      {ATTENDANCE_DATES.map(date => <th key={date} className="p-2 border-l border-slate-100 min-w-[70px] text-center text-[10px] font-black text-slate-500">{date.split('-').slice(0,2).join('/')}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeGroup?.members.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-5 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200/60">
                           <div className="flex justify-between items-center">
                              <div>
                                <div className="font-bold text-slate-900 tracking-tight text-sm uppercase">{member.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono tracking-tight">{member.phone || 'NO PHONE'}</div>
                              </div>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditingMember(member); setMemberForm({ name: member.name, phone: member.phone }); setShowMemberModal(true); }} className="w-8 h-8 flex items-center justify-center text-blue-500 hover:bg-blue-100 rounded-xl"><i className="fas fa-edit text-[10px]"></i></button>
                                <button onClick={() => handleDeleteMember(member.id)} className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-100 rounded-xl"><i className="fas fa-trash-alt text-[10px]"></i></button>
                              </div>
                           </div>
                        </td>
                        {ATTENDANCE_DATES.map(date => (
                          <td key={`${member.id}-${date}`} className="p-0 border-l border-slate-100/60">
                            <AttendanceCell status={activeGroup.attendance[member.id]?.[date] || null} onClick={() => toggleAttendance(member.id, date)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-slate-900 tracking-tight">{editingMember ? 'Update Profile' : 'New Member'}</h3>
            <form onSubmit={handleSaveMember} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Name</label>
                <input autoFocus className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-bold text-slate-900 uppercase tracking-tight" value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value.toUpperCase()})} placeholder="ANDREW SMITH" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Phone</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-bold text-slate-900" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} placeholder="+91 90000 00000" />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowMemberModal(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Discard</button>
                <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-slate-900 tracking-tight">Initialize Entity</h3>
            <form onSubmit={handleAddGroup} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Group Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-bold text-slate-900" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} placeholder="E.G. PROJECT OMEGA" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">System ID</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-bold text-slate-900" value={newGroup.id} onChange={e => setNewGroup({...newGroup, id: e.target.value.replace(/\s+/g, '_').toUpperCase()})} placeholder="OMEGA_01" required />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowAddGroupModal(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Abort</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Execute Initialization</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWeeklyReport && <WeeklyReportModal groups={groups} date={latestDate} onClose={() => setShowWeeklyReport(false)} />}
    </div>
  );
};

export default App;