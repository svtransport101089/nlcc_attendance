import { Group } from './types';

export const ATTENDANCE_DATES = [
  '04-01-2026', '11-01-2026', '18-01-2026', '25-01-2026',
  '01-02-2026', '08-02-2026', '15-02-2026', '22-02-2026',
  '01-03-2026', '08-03-2026', '15-03-2026', '22-03-2026', '29-03-2026',
  '05-04-2026', '12-04-2026', '19-04-2026', '26-04-2026'
];

export const MONTH_HEADERS = [
  { name: 'JANUARY', span: 4 },
  { name: 'FEBRUARY', span: 4 },
  { name: 'MARCH', span: 5 },
  { name: 'APRIL', span: 4 },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: "Solomon_Raja",
    name: "Solomon_Raja",
    leader: "Solomon Raja",
    coLeader: "Parthiban D",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "SR-1", name: "PARTHIBAN", phone: "9499900625" },
      { id: "SR-2", name: "JEARIM", phone: "" },
      { id: "SR-3", name: "JOHN", phone: "" },
      { id: "SR-4", name: "DANI", phone: "" },
      { id: "SR-5", name: "MONISH", phone: "8925114104" },
      { id: "SR-6", name: "IMMANUEL", phone: "" },
      { id: "SR-7", name: "JUDAH", phone: "8122539664" },
      { id: "SR-8", name: "MANUEL", phone: "" },
      { id: "SR-9", name: "K.GANESH", phone: "7358556298" }
    ],
    attendance: {
      "SR-1": { "11-01-2026": "P" },
      "SR-5": { "11-01-2026": "P" },
      "SR-7": { "11-01-2026": "P" },
      "SR-9": { "11-01-2026": "P" }
    }
  },
  {
    id: "Samuel_Little",
    name: "Samuel_Little",
    leader: "Samuel Little",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "SL-1", name: "DARRYS KIMSEN", phone: "9884119522" },
      { id: "SL-2", name: "SANJAY JOSHUA", phone: "7305764336" },
      { id: "SL-3", name: "SAM ANDREWS", phone: "9369843208" },
      { id: "SL-4", name: "STEVE WATSON", phone: "7305477947" },
      { id: "SL-5", name: "BLESSON SHARON", phone: "7339538719" },
      { id: "SL-6", name: "MUKESH", phone: "7397613399" },
      { id: "SL-7", name: "AKASH", phone: "8778856266" },
      { id: "SL-8", name: "MARCUS", phone: "8939278095" },
      { id: "SL-9", name: "SAMUEL", phone: "9384816197" },
      { id: "SL-10", name: "ANDREW JONES ARUN", phone: "9566639948" }
    ],
    attendance: {
      "SL-1": { "04-01-2026": "P", "11-01-2026": "P" },
      "SL-4": { "11-01-2026": "P" },
      "SL-5": { "11-01-2026": "P" },
      "SL-6": { "11-01-2026": "P" },
      "SL-7": { "11-01-2026": "P" },
      "SL-8": { "11-01-2026": "P" }
    }
  },
  {
    id: "Manojh",
    name: "Manojh",
    leader: "MANOJH",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "M-1", name: "SUNDAR DAVID", phone: "" },
      { id: "M-2", name: "ABHISHEK", phone: "" },
      { id: "M-3", name: "ANDREW EZHIL", phone: "" },
      { id: "M-4", name: "RONNIC", phone: "" },
      { id: "M-5", name: "JAISON", phone: "" },
      { id: "M-6", name: "SAM ALWYN", phone: "" },
      { id: "M-7", name: "SANTHOSH", phone: "" },
      { id: "M-8", name: "ASHWIN", phone: "" },
      { id: "M-9", name: "AKASH", phone: "" }
    ],
    attendance: {}
  },
  {
    id: "Prasath",
    name: "Prasath",
    leader: "Prasath",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "P-1", name: "JOHN", phone: "" },
      { id: "P-2", name: "KEVIN IMMANUEL", phone: "" },
      { id: "P-3", name: "JEROME", phone: "" },
      { id: "P-4", name: "BENJAMIN", phone: "" },
      { id: "P-5", name: "JEYANTH", phone: "" },
      { id: "P-6", name: "PRAVEEN", phone: "" },
      { id: "P-7", name: "CHRISTY JOSHUA", phone: "" },
      { id: "P-8", name: "EBENESAR", phone: "" },
      { id: "P-9", name: "SACHIN", phone: "" },
      { id: "P-10", name: "NIVIN", phone: "" },
      { id: "P-11", name: "JOHNSON", phone: "" },
      { id: "P-12", name: "ARISTO", phone: "" },
      { id: "P-13", name: "DANIEL JOSIA", phone: "" },
      { id: "P-14", name: "DANIEL S", phone: "" }
    ],
    attendance: {}
  },
  {
    id: "David_G",
    name: "David_G",
    leader: "DAVID G",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "DG-1", name: "JOSHUVA", phone: "" },
      { id: "DG-2", name: "JACK", phone: "" },
      { id: "DG-3", name: "JOSHUA", phone: "" },
      { id: "DG-4", name: "IMMAN", phone: "" },
      { id: "DG-5", name: "DAVID", phone: "" },
      { id: "DG-6", name: "THEO", phone: "" },
      { id: "DG-7", name: "JACK STEVE", phone: "" },
      { id: "DG-8", name: "SUNDAR", phone: "" }
    ],
    attendance: {
      "DG-1": { "04-01-2026": "A", "11-01-2026": "A" },
      "DG-2": { "04-01-2026": "A", "11-01-2026": "A" },
      "DG-3": { "04-01-2026": "A", "11-01-2026": "A" },
      "DG-4": { "04-01-2026": "A", "11-01-2026": "A" },
      "DG-5": { "04-01-2026": "A", "11-01-2026": "P" },
      "DG-6": { "04-01-2026": "A", "11-01-2026": "A" },
      "DG-7": { "04-01-2026": "A", "11-01-2026": "A" },
      "DG-8": { "04-01-2026": "A", "11-01-2026": "P" }
    }
  },
  {
    id: "Antony_George",
    name: "Antony_George",
    leader: "Antony George",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "AG-1", name: "JAI PRAKASH", phone: "" },
      { id: "AG-2", name: "JOSHUA", phone: "" },
      { id: "AG-3", name: "SHAM DENNIS", phone: "" },
      { id: "AG-4", name: "JOEL", phone: "" },
      { id: "AG-5", name: "SHYAM RITHISH", phone: "" },
      { id: "AG-6", name: "GOWTHAM", phone: "" },
      { id: "AG-7", name: "JADEN", phone: "" },
      { id: "AG-8", name: "GODWIN", phone: "" },
      { id: "AG-9", name: "FREDRICK", phone: "" },
      { id: "AG-10", name: "PRADEEP", phone: "" },
      { id: "AG-11", name: "SANGEETH", phone: "" }
    ],
    attendance: {}
  },
  {
    id: "Antony_Raj",
    name: "Antony_Raj",
    leader: "Antony Raj",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "AR-1", name: "ABACUS", phone: "" },
      { id: "AR-2", name: "JAMES", phone: "" },
      { id: "AR-3", name: "CHADWICK", phone: "" },
      { id: "AR-4", name: "MESHACH", phone: "" },
      { id: "AR-5", name: "SIVA", phone: "" },
      { id: "AR-6", name: "VASANTH", phone: "" },
      { id: "AR-7", name: "SHYAM", phone: "" },
      { id: "AR-8", name: "DARISH", phone: "" },
      { id: "AR-9", name: "SANJAY", phone: "" },
      { id: "AR-10", name: "ALBERT", phone: "" },
      { id: "AR-11", name: "JASON", phone: "" },
      { id: "AR-12", name: "VISHAL", phone: "" }
    ],
    attendance: {
      "AR-1": { "04-01-2026": "A", "11-01-2026": "A" },
      "AR-2": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-3": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-4": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-5": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-6": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-7": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-8": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-9": { "04-01-2026": "P", "11-01-2026": "P" },
      "AR-10": { "04-01-2026": "A", "11-01-2026": "A" },
      "AR-11": { "04-01-2026": "P", "11-01-2026": "P" }
    }
  },
  {
    id: "Daniel",
    name: "Daniel",
    leader: "Daniel",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "D-1", name: "J JERAULD ALWIN", phone: "" },
      { id: "D-2", name: "OBAMA", phone: "" },
      { id: "D-3", name: "RUFUS", phone: "" },
      { id: "D-4", name: "BHAVESH A R", phone: "" },
      { id: "D-5", name: "MARTIN", phone: "" },
      { id: "D-6", name: "SACHIN", phone: "" },
      { id: "D-7", name: "ROSHAN", phone: "" },
      { id: "D-8", name: "EBINEZER", phone: "" },
      { id: "D-9", name: "REKSIT", phone: "" },
      { id: "D-10", name: "ASHWIN", phone: "" }
    ],
    attendance: {
      "D-2": { "11-01-2026": "P" },
      "D-3": { "11-01-2026": "P" },
      "D-5": { "11-01-2026": "P" },
      "D-6": { "11-01-2026": "P" },
      "D-7": { "11-01-2026": "P" },
      "D-9": { "11-01-2026": "P" },
      "D-10": { "11-01-2026": "P" }
    }
  },
  {
    id: "Rajesh",
    name: "Rajesh",
    leader: "Rajesh",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "R-1", name: "NAVEEN", phone: "6369102488" },
      { id: "R-2", name: "EBENEZER", phone: "7200442654" },
      { id: "R-3", name: "MOSES", phone: "7358386439" },
      { id: "R-4", name: "SIBIRAJ", phone: "9345718898" },
      { id: "R-5", name: "VISHAL", phone: "7806802963" },
      { id: "R-6", name: "LOKESH", phone: "9940310964" },
      { id: "R-7", name: "THARUN", phone: "9786434094" }
    ],
    attendance: {}
  },
  {
    id: "Sugumar",
    name: "Sugumar",
    leader: "Sugumar",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "S-1", name: "ADLEY JONATHAN", phone: "9940021149" },
      { id: "S-2", name: "ROSHAN", phone: "9094234220" },
      { id: "S-3", name: "MONISH", phone: "9841754000" },
      { id: "S-4", name: "MANOVAH CHARLES", phone: "9942747879" },
      { id: "S-5", name: "DENO JHOSAN", phone: "7299075972" },
      { id: "S-6", name: "JASON", phone: "9150950095" },
      { id: "S-7", name: "ADEN DANIEL", phone: "9489825511" },
      { id: "S-8", name: "JOTHAM DANIEL", phone: "9790934176" },
      { id: "S-9", name: "SAMUEL V R", phone: "6369664513" }
    ],
    attendance: {
      "S-1": { "04-01-2026": "P", "11-01-2026": "P" },
      "S-5": { "04-01-2026": "P", "11-01-2026": "P" },
      "S-6": { "04-01-2026": "P", "11-01-2026": "P" },
      "S-7": { "04-01-2026": "P", "11-01-2026": "P" },
      "S-9": { "04-01-2026": "P", "11-01-2026": "P" }
    }
  },
  {
    id: "Robert",
    name: "Robert",
    leader: "Robert",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "RO-1", name: "LAWRANCE", phone: "" },
      { id: "RO-2", name: "SAM JEREMIAH", phone: "" },
      { id: "RO-3", name: "JEFEREY SOLOMON", phone: "" },
      { id: "RO-4", name: "JACK", phone: "" },
      { id: "RO-5", name: "GODWIN", phone: "" },
      { id: "RO-6", name: "RANJITH", phone: "" },
      { id: "RO-7", name: "MELWIN", phone: "" },
      { id: "RO-8", name: "DANIEL", phone: "" },
      { id: "RO-9", name: "JERALD", phone: "" },
      { id: "RO-10", name: "MICHAEL", phone: "" },
      { id: "RO-11", name: "YUVAN SHANKAR", phone: "" },
      { id: "RO-12", name: "JONATHAN", phone: "" },
      { id: "RO-13", name: "NITHIS ROBIN JOHNPAUL", phone: "" },
      { id: "RO-14", name: "P MELVIN DOSS", phone: "" },
      { id: "RO-15", name: "DANES", phone: "" },
      { id: "RO-16", name: "P KELVIN DOSS", phone: "" },
      { id: "RO-17", name: "GOWTHAM", phone: "" }
    ],
    attendance: {
      "RO-3": { "11-01-2026": "P" },
      "RO-6": { "04-01-2026": "P", "11-01-2026": "P" },
      "RO-12": { "11-01-2026": "P" },
      "RO-13": { "11-01-2026": "P" },
      "RO-14": { "11-01-2026": "P" },
      "RO-15": { "11-01-2026": "P" },
      "RO-16": { "11-01-2026": "P" },
      "RO-17": { "11-01-2026": "P" }
    }
  },
  {
    id: "Prince_Victor_Jenies",
    name: "Prince_Victor_Jenies",
    leader: "Prince Victor Jenies",
    coLeader: "Immanuel A",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "PVJ-1", name: "BRITTO", phone: "" },
      { id: "PVJ-2", name: "ALLWIN", phone: "" },
      { id: "PVJ-3", name: "JEEVA SUNDAR", phone: "" },
      { id: "PVJ-4", name: "SAMSON", phone: "" },
      { id: "PVJ-5", name: "JONATHAN", phone: "" },
      { id: "PVJ-6", name: "IMMANUEL", phone: "" },
      { id: "PVJ-7", name: "JOSEPH FERNANDAS", phone: "" },
      { id: "PVJ-8", name: "LORD KELVIN", phone: "" },
      { id: "PVJ-9", name: "KEVIN", phone: "" },
      { id: "PVJ-10", name: "SPARJAN", phone: "" },
      { id: "PVJ-11", name: "AKASH", phone: "" },
      { id: "PVJ-12", name: "PAUL EBENEZER", phone: "" },
      { id: "PVJ-13", name: "BENNY", phone: "" }
    ],
    attendance: {
      "PVJ-2": { "11-01-2026": "P" },
      "PVJ-6": { "11-01-2026": "P" },
      "PVJ-13": { "11-01-2026": "P" }
    }
  },
  {
    id: "Jegan",
    name: "Jegan",
    leader: "Jegan",
    coLeader: "Hemnath Kumar",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "J-1", name: "NAVEEN", phone: "" },
      { id: "J-2", name: "IMMANUEL", phone: "" },
      { id: "J-3", name: "UMAYAN", phone: "" },
      { id: "J-4", name: "CHARLES", phone: "" },
      { id: "J-5", name: "VIPUL ASHOK", phone: "" },
      { id: "J-6", name: "HEMANTH", phone: "" },
      { id: "J-7", name: "ABISHEK", phone: "" },
      { id: "J-8", name: "SANJITH", phone: "" },
      { id: "J-9", name: "JOSHUA", phone: "" },
      { id: "J-10", name: "SAM JAPHETH", phone: "" },
      { id: "J-11", name: "ABISHEK", phone: "" },
      { id: "J-12", name: "BHARATH", phone: "" },
      { id: "J-13", name: "SIMEON", phone: "" }
    ],
    attendance: {
      "J-3": { "04-01-2026": "P", "11-01-2026": "P" },
      "J-4": { "04-01-2026": "P", "11-01-2026": "P" },
      "J-6": { "04-01-2026": "P", "11-01-2026": "P" },
      "J-9": { "11-01-2026": "P" },
      "J-10": { "11-01-2026": "P" },
      "J-13": { "11-01-2026": "P" }
    }
  },
  {
    id: "Joshua_Samson",
    name: "Joshua_Samson",
    leader: "Joshua Samson",
    coLeader: "",
    period: "JANUARY 2026 - APRIL 2026",
    members: [
      { id: "JS-1", name: "AMOS", phone: "" },
      { id: "JS-2", name: "SANJAY", phone: "" },
      { id: "JS-3", name: "JOSHUVA", phone: "" },
      { id: "JS-4", name: "ENOCH", phone: "" },
      { id: "JS-5", name: "JUSTUS", phone: "" },
      { id: "JS-6", name: "JASPER", phone: "" },
      { id: "JS-7", name: "SAMUEL", phone: "" },
      { id: "JS-8", name: "SILAS", phone: "6369458965" },
      { id: "JS-9", name: "KENNETH", phone: "7845143995" },
      { id: "JS-10", name: "JOHN", phone: "6363524491" },
      { id: "JS-11", name: "JOEL", phone: "" },
      { id: "JS-12", name: "CHRISTY SAMUEL", phone: "" }
    ],
    attendance: {
      "JS-1": { "11-01-2026": "P" },
      "JS-2": { "11-01-2026": "P" },
      "JS-3": { "11-01-2026": "P" },
      "JS-4": { "11-01-2026": "P" },
      "JS-5": { "11-01-2026": "P" },
      "JS-6": { "11-01-2026": "P" },
      "JS-7": { "11-01-2026": "P" },
      "JS-8": { "11-01-2026": "P" },
      "JS-9": { "11-01-2026": "P" },
      "JS-10": { "11-01-2026": "P" },
      "JS-11": { "11-01-2026": "P" },
      "JS-12": { "11-01-2026": "A" }
    }
  }
];