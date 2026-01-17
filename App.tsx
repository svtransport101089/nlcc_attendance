
import React, { useState, useMemo, useCallback } from 'react';
import { 
  INITIAL_GROUPS,
  ATTENDANCE_DATES, 
  MONTH_HEADERS 
} from './constants';
import { Group, AttendanceStatus, AttendanceStats, Member, AttendanceData } from './types';
import { AttendanceCell } from './components/AttendanceCell';
import { StatsPanel } from './components/StatsPanel';
import { DashboardOverview } from './components/DashboardOverview';
import { analyzeAttendance } from './geminiService';

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string | 'dashboard'>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  
  // Member CRUD State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '' });
  
  // Group CRUD State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', leader: '', id: '' });

  const activeGroup = useMemo(() => 
    groups.find(g => g.id === activeGroupId)
  , [groups, activeGroupId]);

  const toggleAttendance = useCallback((memberId: string, date: string) => {
    if (!activeGroupId || activeGroupId === 'dashboard') return;

    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id !== activeGroupId) return group;

      const current = group.attendance[memberId]?.[date];
      let next: AttendanceStatus = 'P';
      if (current === 'P') next = 'A';
      else if (current === 'A') next = null;

      return {
        ...group,
        attendance: {
          ...group.attendance,
          [memberId]: {
            ...(group.attendance[memberId] || {}),
            [date]: next,
          }
        }
      };
    }));
  }, [activeGroupId]);

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

  const handleExportCSV = () => {
    if (!activeGroup) return;

    const headers = ['Member Name', 'Phone', ...ATTENDANCE_DATES];
    const csvContent = [
      headers.join(','),
      ...activeGroup.members.map(member => {
        const row = [
          `"${member.name}"`, // Wrap in quotes to handle commas in names
          `"${member.phone}"`,
          ...ATTENDANCE_DATES.map(date => activeGroup.attendance[member.id]?.[date] || '-')
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeGroup.name.replace(/\s+/g, '_')}_attendance.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGlobalImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const headerRow = lines[0].split(',');
      
      // Basic CSV parsing for groups
      const parsedGroups: Record<string, Group> = {};

      // Map Date Headers: Find indices for known dates
      const dateIndices: Record<string, number> = {};
      
      // Mapping logic for specific CSV provided: "2026-01-04 00:00:00" -> "04-01-2026"
      headerRow.forEach((col, idx) => {
        const cleanCol = col.trim().replace(/"/g, '');
        if (cleanCol.includes('2026-01-04')) dateIndices['04-01-2026'] = idx;
        if (cleanCol.includes('2026-01-11')) dateIndices['11-01-2026'] = idx;
        if (cleanCol.includes('2026-01-18')) dateIndices['18-01-2026'] = idx;
        if (cleanCol.includes('2026-01-25')) dateIndices['25-01-2026'] = idx;
        // Add more mappings if CSV contains more dates later
      });

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split, handling commas
        // Note: This basic split might fail on quoted commas, but works for provided simple structure
        const cols = line.split(','); 
        if (cols.length < 5) continue;

        // Extract Group Info
        // Expecting: Sheet_Name, Group_Id, Leader, Co_Leader, Month_Range, Member Name, PHONE, ...Dates
        const groupId = cols[1]?.trim();
        const leader = cols[2]?.trim();
        const coLeader = cols[3]?.trim();
        const period = cols[4]?.trim();
        const memberName = cols[5]?.trim();
        const phone = cols[6]?.trim() || '';

        if (!groupId || !memberName) continue;

        if (!parsedGroups[groupId]) {
          parsedGroups[groupId] = {
            id: groupId,
            name: groupId, // Using ID as name if name not separate
            leader: leader || 'Unknown',
            coLeader: coLeader || '',
            period: period || 'JANUARY 2026 - APRIL 2026',
            members: [],
            attendance: {}
          };
        }

        const memberId = `${groupId}-${parsedGroups[groupId].members.length + 1}`;
        
        // Add Member
        parsedGroups[groupId].members.push({
          id: memberId,
          name: memberName,
          phone: phone
        });

        // Add Attendance
        const memberAtt: Record<string, AttendanceStatus> = {};
        Object.entries(dateIndices).forEach(([dateStr, colIdx]) => {
          const val = cols[colIdx]?.trim();
          if (val === 'P') memberAtt[dateStr] = 'P';
          else if (val === 'A') memberAtt[dateStr] = 'A';
          else memberAtt[dateStr] = null;
        });

        parsedGroups[groupId].attendance[memberId] = memberAtt;
      }

      const newGroupList = Object.values(parsedGroups);
      if (newGroupList.length > 0) {
        setGroups(newGroupList);
        alert(`Successfully imported ${newGroupList.length} groups with ${newGroupList.reduce((acc, g) => acc + g.members.length, 0)} members.`);
      } else {
        alert("No valid groups found in CSV.");
      }
    };
    reader.readAsText(file);
  };

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ name: '', phone: '' });
    setShowMemberModal(true);
  };

  const openEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({ name: member.name, phone: member.phone });
    setShowMemberModal(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || activeGroupId === 'dashboard') return;
    
    setGroups(prev => prev.map(g => {
      if (g.id !== activeGroupId) return g;
      
      if (editingMember) {
        // Update existing
        return {
          ...g,
          members: g.members.map(m => m.id === editingMember.id ? { ...m, ...memberForm } : m)
        };
      } else {
        // Create new
        const member: Member = {
          id: Date.now().toString(),
          name: memberForm.name,
          phone: memberForm.phone || 'N/A'
        };
        return { ...g, members: [...g.members, member] };
      }
    }));
    
    setMemberForm({ name: '', phone: '' });
    setEditingMember(null);
    setShowMemberModal(false);
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim() || activeGroupId === 'dashboard') return;

    const lines = bulkInput.split('\n');
    const newMembers: Member[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Split by comma or tab
      const parts = trimmed.split(/[,|\t]/);
      const name = parts[0].trim();
      const phone = parts[1]?.trim() || 'N/A';

      if (name) {
        newMembers.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          phone
        });
      }
    });

    if (newMembers.length > 0) {
      setGroups(prev => prev.map(g => {
        if (g.id !== activeGroupId) return g;
        return { ...g, members: [...g.members, ...newMembers] };
      }));
    }

    setBulkInput('');
    setShowBulkModal(false);
  };

  const handleDeleteMember = (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member and their attendance history?")) return;
    
    setGroups(prev => prev.map(g => {
      if (g.id !== activeGroupId) return g;
      
      const newAttendance = { ...g.attendance };
      delete newAttendance[memberId];
      
      return {
        ...g,
        members: g.members.filter(m => m.id !== memberId),
        attendance: newAttendance
      };
    }));
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name || !newGroup.id) return;

    const group: Group = {
      id: newGroup.id,
      name: newGroup.name,
      leader: newGroup.leader || 'Daniel',
      coLeader: '',
      period: 'JANUARY 2026 - APRIL 2026',
      members: [],
      attendance: {}
    };

    setGroups([...groups, group]);
    setNewGroup({ name: '', leader: '', id: '' });
    setShowAddGroupModal(false);
    setActiveGroupId(group.id);
  };

  // Helper to count potential members in bulk input
  const potentialMemberCount = bulkInput.split('\n').filter(l => l.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-check"></i>
              </div>
              <span className="font-bold text-lg hidden sm:inline">ProAttend</span>
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              <button 
                onClick={() => setActiveGroupId('dashboard')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  activeGroupId === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </button>
              {groups.map(g => (
                <button 
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    activeGroupId === g.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddGroupModal(true)}
              className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
              title="Add New Group"
            >
              <i className="fas fa-folder-plus text-xl"></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        {activeGroupId === 'dashboard' ? (
          <DashboardOverview 
            groups={groups} 
            onSelectGroup={setActiveGroupId} 
            onImport={handleGlobalImport}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Group Header Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{activeGroup?.name}</h2>
                <p className="text-slate-500 font-medium">Group ID: <span className="font-bold">{activeGroup?.id}</span> • Leader: {activeGroup?.leader}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={openAddMember}
                  className="bg-white border border-slate-200 hover:border-emerald-600 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-user-plus text-emerald-600"></i>
                  Add Member
                </button>
                <button 
                  onClick={() => setShowBulkModal(true)}
                  className="bg-white border border-slate-200 hover:border-blue-600 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-file-import text-blue-600"></i>
                  Bulk Upload
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="bg-white border border-slate-200 hover:border-slate-600 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-file-export text-slate-600"></i>
                  Export CSV
                </button>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles text-purple-400'}`}></i>
                  AI Insights
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StatsPanel data={groupStats} />
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-brain text-purple-600"></i>
                  Group Health Audit
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar text-sm text-slate-600 leading-relaxed">
                  {analysis ? (
                    <div className="whitespace-pre-wrap animate-in fade-in duration-500">{analysis}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
                      <i className="fas fa-chart-simple text-4xl mb-4 opacity-20"></i>
                      <p>Run AI Analysis to see attendance trends and risk assessments for this group.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Attendance Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th rowSpan={2} className="sticky-col border-r border-slate-200 px-6 py-4 text-left font-bold text-slate-700 min-w-[240px]">
                        Member Management
                      </th>
                      <th rowSpan={2} className="border-r border-slate-200 px-6 py-4 text-left font-bold text-slate-700 min-w-[140px]">
                        Contact
                      </th>
                      {MONTH_HEADERS.map((month) => (
                        <th key={month.name} colSpan={month.span} className="border-r border-slate-200 px-6 py-2 text-center text-xs font-black tracking-widest text-slate-400 bg-slate-100 uppercase">
                          {month.name}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-white border-b border-slate-200">
                      {ATTENDANCE_DATES.map((date) => (
                        <th key={date} className="border-r border-slate-200 px-2 py-3 text-center text-[10px] font-black text-slate-500 whitespace-nowrap min-w-[80px]">
                          {date}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup?.members.map((member, idx) => (
                      <tr key={member.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 group/row transition-colors`}>
                        <td className="sticky-col border-r border-slate-200 px-6 py-3 font-bold text-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{member.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEditMember(member)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Member"
                              >
                                <i className="fas fa-edit text-xs"></i>
                              </button>
                              <button 
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Member"
                              >
                                <i className="fas fa-trash-alt text-xs"></i>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="border-r border-slate-200 px-6 py-3 text-xs text-slate-500 font-medium">
                          {member.phone}
                        </td>
                        {ATTENDANCE_DATES.map((date) => (
                          <td key={`${member.id}-${date}`} className="border-r border-slate-100 p-0">
                            <AttendanceCell 
                              status={activeGroup.attendance[member.id]?.[date] || null} 
                              onClick={() => toggleAttendance(member.id, date)} 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {activeGroup?.members.length === 0 && (
                      <tr>
                        <td colSpan={ATTENDANCE_DATES.length + 2} className="px-6 py-12 text-center text-slate-400">
                          <i className="fas fa-users-slash text-3xl mb-3 block opacity-20"></i>
                          No members in this group yet. Add your first member above!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Member CRUD Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 ${editingMember ? 'bg-blue-600' : 'bg-emerald-600'} text-white flex items-center justify-between`}>
              <h2 className="text-xl font-bold">{editingMember ? 'Update Member' : 'Add New Member'}</h2>
              <button onClick={() => setShowMemberModal(false)} className="hover:opacity-70">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                  required 
                  autoFocus 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Enter name..." 
                  value={memberForm.name} 
                  onChange={e => setMemberForm({...memberForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone / ID</label>
                <input 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Enter contact info..." 
                  value={memberForm.phone} 
                  onChange={e => setMemberForm({...memberForm, phone: e.target.value})} 
                />
              </div>
              <button 
                type="submit" 
                className={`w-full ${editingMember ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold py-4 rounded-xl shadow-lg transition-all`}
              >
                {editingMember ? 'Update Details' : 'Save Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Bulk Member Import</h2>
              <button onClick={() => setShowBulkModal(false)} className="hover:opacity-70">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                <p className="font-bold mb-1 underline">Format Instructions:</p>
                <p>Paste names and phones separated by a comma or tab.</p>
                <code className="block mt-2 bg-white/50 p-2 rounded border border-blue-200">
                  John Doe, 9876543210<br/>
                  Jane Smith, 9123456789
                </code>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Paste Data Here</label>
                <textarea 
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none custom-scrollbar" 
                  placeholder="Name, Phone..." 
                  value={bulkInput} 
                  onChange={e => setBulkInput(e.target.value)} 
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-500">
                  <span className="font-bold text-blue-600">{potentialMemberCount}</span> members detected
                </p>
                <button 
                  onClick={handleBulkImport}
                  disabled={potentialMemberCount === 0}
                  className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Import Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Create Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Create New Group</h2>
              <button onClick={() => setShowAddGroupModal(false)} className="hover:opacity-70">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group ID (Unique)</label>
                <input required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" placeholder="e.g. G-DANIEL-03" value={newGroup.id} onChange={e => setNewGroup({...newGroup, id: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Name</label>
                <input required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" placeholder="e.g. Outreach Team" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Leader Name</label>
                <input className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" placeholder="Daniel" value={newGroup.leader} onChange={e => setNewGroup({...newGroup, leader: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition-all">Create Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
