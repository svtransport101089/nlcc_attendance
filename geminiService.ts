
import { GoogleGenAI } from "@google/genai";
import { Member, AttendanceData, Group } from "./types";

// Always initialize GoogleGenAI using a named parameter with process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Using gemini-3-flash-preview for basic text analysis task.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Use the .text property to directly access the generated string.
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Could not perform AI analysis at this time. Please check your network or try again later.";
  }
};

export const analyzeGlobalAttendance = async (groups: Group[], dates: string[]) => {
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
    // Use the .text property to directly access the generated string.
    return response.text;
  } catch (error) {
    console.error("Global analysis failed:", error);
    return "Could not generate global report. Please try again.";
  }
};

export const analyzeWeeklyReport = async (groups: Group[], date: string) => {
  const weeklyStats = groups.map(g => {
    let p = 0;
    let a = 0;
    g.members.forEach(m => {
      const status = g.attendance[m.id]?.[date];
      if (status === 'P') p++;
      else if (status === 'A') a++;
    });
    return {
      groupName: g.name,
      leader: g.leader,
      present: p,
      absent: a,
      total: g.members.length,
      rate: g.members.length > 0 ? Math.round((p / g.members.length) * 100) : 0
    };
  });

  const prompt = `
    Analyze the attendance for the week of ${date}.
    Data: ${JSON.stringify(weeklyStats)}

    Provide a "Weekly Performance Briefing" (Markdown):
    1. **Top Performers**: Highlight groups with 90%+ attendance.
    2. **Concern Groups**: Identify groups with less than 60% attendance this week.
    3. **Sudden Drops**: If you notice a group that usually performs well but had a bad week (mental check against averages), mention it.
    4. **Weekly Action Goal**: One specific focus for all leaders next week.
    
    Format professionally with icons in headers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Use the .text property to directly access the generated string.
    return response.text;
  } catch (error) {
    return "Weekly analysis error.";
  }
};
