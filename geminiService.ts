
import { GoogleGenAI } from "@google/genai";
import { Member, AttendanceData, Group } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeAttendance = async (
  members: Member[],
  attendance: AttendanceData,
  dates: string[]
) => {
  const prompt = `
    Analyze the following attendance data for a group. 
    Members: ${JSON.stringify(members)}
    Attendance Data: ${JSON.stringify(attendance)}
    Dates: ${JSON.stringify(dates)}

    Provide a professional summary:
    1. Overall attendance health.
    2. Most consistent members.
    3. At-risk members (absent for more than 2 consecutive sessions).
    4. Suggested actions for the group leader Daniel.
    
    Format the response as clear Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Could not perform AI analysis at this time. Please check your network or try again later.";
  }
};

export const analyzeGlobalAttendance = async (groups: Group[], dates: string[]) => {
  // Simplify data to avoid token limits, focusing on stats
  const groupSummaries = groups.map(g => {
    let present = 0;
    let absent = 0;
    let total = 0;
    
    Object.values(g.attendance).forEach(memberRecord => {
      Object.values(memberRecord).forEach(status => {
        if (status === 'P') present++;
        if (status === 'A') absent++;
        if (status) total++;
      });
    });

    return {
      name: g.name,
      leader: g.leader,
      memberCount: g.members.length,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  });

  const prompt = `
    Act as a senior operations analyst. Analyze the attendance data for the following groups in the organization:
    ${JSON.stringify(groupSummaries)}

    Provide a Consolidated Executive Report (Markdown) covering:
    1. **Organization Health**: Overall attendance trends across all groups.
    2. **Leader Performance**: Which group leaders are driving the best engagement?
    3. **Critical Areas**: Identify groups performing below 50% attendance.
    4. **Strategic Recommendations**: 3 key actionable steps for the main administrator to improve overall participation.

    Keep it concise, professional, and actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Global analysis failed:", error);
    return "Could not generate global report. Please try again.";
  }
};
