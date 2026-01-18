import { Group, Member, AttendanceStatus, Activity } from './types';
import { INITIAL_GROUPS } from './constants';

const STORAGE_KEYS = {
  GROUPS: 'proattend_v2_groups',
  ACTIVITIES: 'proattend_v2_activities'
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const fetchGroupsFromDb = async (): Promise<Group[]> => {
  // Professional feel: simulate micro-delay for IO
  await new Promise(r => setTimeout(r, 450));
  const groups = getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
  if (groups.length === 0) {
    saveToStorage(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    return INITIAL_GROUPS;
  }
  return groups;
};

export const fetchActivitiesFromDb = async (): Promise<Activity[]> => {
  return getFromStorage<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
};

export const logActivityToDb = async (activity: Activity) => {
  const activities = await fetchActivitiesFromDb();
  const updated = [activity, ...activities].slice(0, 100);
  saveToStorage(STORAGE_KEYS.ACTIVITIES, updated);
};

export const deleteActivityFromDb = async (activityId: string) => {
  const activities = await fetchActivitiesFromDb();
  saveToStorage(STORAGE_KEYS.ACTIVITIES, activities.filter(a => a.id !== activityId));
};

export const updateAttendanceInDb = async (groupId: string, memberId: string, date: string, status: AttendanceStatus) => {
  const groups = getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
  const updated = groups.map(g => {
    if (g.id === groupId) {
      return {
        ...g,
        attendance: {
          ...g.attendance,
          [memberId]: {
            ...(g.attendance[memberId] || {}),
            [date]: status
          }
        }
      };
    }
    return g;
  });
  saveToStorage(STORAGE_KEYS.GROUPS, updated);
};

export const addGroupToDb = async (group: Group) => {
  const groups = getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
  saveToStorage(STORAGE_KEYS.GROUPS, [...groups, group]);
};

export const updateGroupMembersInDb = async (groupId: string, members: Member[]) => {
  const groups = getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
  const updated = groups.map(g => g.id === groupId ? { ...g, members } : g);
  saveToStorage(STORAGE_KEYS.GROUPS, updated);
};

export const deleteMemberFromDb = async (groupId: string, memberId: string, members: Member[]) => {
  const groups = getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
  const updated = groups.map(g => {
    if (g.id === groupId) {
      const newAtt = { ...g.attendance };
      delete newAtt[memberId];
      return { ...g, members, attendance: newAtt };
    }
    return g;
  });
  saveToStorage(STORAGE_KEYS.GROUPS, updated);
};

export const batchImportGroupsToDb = async (newGroups: Group[]) => {
  saveToStorage(STORAGE_KEYS.GROUPS, newGroups);
};

export const seedDatabase = async (initialGroups: Group[]) => {
  saveToStorage(STORAGE_KEYS.GROUPS, initialGroups);
};