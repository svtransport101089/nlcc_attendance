
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch, deleteField, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { Group, Member, AttendanceStatus, Activity } from './types';

const GROUPS_COLLECTION = 'groups';
const ACTIVITIES_COLLECTION = 'activities';

export const fetchGroupsFromDb = async (): Promise<Group[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, GROUPS_COLLECTION));
    const groups: Group[] = [];
    querySnapshot.forEach((doc) => {
      groups.push(doc.data() as Group);
    });
    return groups;
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
};

export const fetchActivitiesFromDb = async (): Promise<Activity[]> => {
  try {
    const q = query(collection(db, ACTIVITIES_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push(doc.data() as Activity);
    });
    return activities;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

export const logActivityToDb = async (activity: Activity) => {
  await setDoc(doc(db, ACTIVITIES_COLLECTION, activity.id), activity);
};

export const deleteActivityFromDb = async (activityId: string) => {
  await deleteDoc(doc(db, ACTIVITIES_COLLECTION, activityId));
};

export const seedDatabase = async (initialGroups: Group[]) => {
  const batch = writeBatch(db);
  initialGroups.forEach(group => {
    const docRef = doc(db, GROUPS_COLLECTION, group.id);
    batch.set(docRef, group);
  });
  await batch.commit();
};

export const updateAttendanceInDb = async (groupId: string, memberId: string, date: string, status: AttendanceStatus) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const fieldPath = `attendance.${memberId}.${date}`;
  await updateDoc(groupRef, {
    [fieldPath]: status
  });
};

export const addGroupToDb = async (group: Group) => {
  await setDoc(doc(db, GROUPS_COLLECTION, group.id), group);
};

export const updateGroupMembersInDb = async (groupId: string, members: Member[]) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, { members });
};

export const deleteMemberFromDb = async (groupId: string, memberId: string, members: Member[]) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, {
    members: members,
    [`attendance.${memberId}`]: deleteField()
  });
};

export const batchImportGroupsToDb = async (groups: Group[]) => {
  const batch = writeBatch(db);
  groups.forEach(group => {
    const docRef = doc(db, GROUPS_COLLECTION, group.id);
    batch.set(docRef, group);
  });
  await batch.commit();
};
