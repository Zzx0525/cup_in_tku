// 獨立存放全育盃各球類、日期、階段、場地、實際比賽地點與各校隊伍對戰資料
const VENUE_LOCATIONS = {
  籃球: {
    default: "淡江大學紹謨體育館7樓"
  },
  排球: {
    "12/5": "真理大學體育館",
    "12/6": "淡江大學紹謨體育館4樓"
  },
  羽球: {
    "12/5": "淡江大學紹謨體育館4樓"
  }
};

function resolveLocation(sport, date) {
  const cfg = VENUE_LOCATIONS[sport];
  if (!cfg) return "";
  return cfg[date] || cfg.default || "";
}

const RAW_SCHEDULE_DATA = [
  // ================= 籃球（預賽 12/5｜複賽 / 決賽 12/6｜淡江大學紹謨體育館7樓） =================
  { sport: "籃球", date: "12/5", stage: "預賽", time: "08:30", duration: 50, venue: "籃球場 一", teamA: "屏東大學", teamB: "淡江大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "08:30", duration: 50, venue: "籃球場 二", teamA: "師範大學", teamB: "台東大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "09:30", duration: 50, venue: "籃球場 一", teamA: "台南大學", teamB: "台中教育大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "09:30", duration: 50, venue: "籃球場 二", teamA: "嘉義大學", teamB: "清華大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "10:30", duration: 50, venue: "籃球場 一", teamA: "屏東大學", teamB: "東華大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "10:30", duration: 50, venue: "籃球場 二", teamA: "師範大學", teamB: "政治大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "11:30", duration: 50, venue: "籃球場 一", teamA: "台南大學", teamB: "北教大教經", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "11:30", duration: 50, venue: "籃球場 二", teamA: "嘉義大學", teamB: "北教大教育", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "13:00", duration: 50, venue: "籃球場 一", teamA: "淡江大學", teamB: "東華大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "14:00", duration: 50, venue: "籃球場 一", teamA: "台東大學", teamB: "政治大學", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "15:00", duration: 50, venue: "籃球場 一", teamA: "台中教育大學", teamB: "北教大教經", type: "prelim" },
  { sport: "籃球", date: "12/5", stage: "預賽", time: "16:00", duration: 50, venue: "籃球場 一", teamA: "清華大學", teamB: "北教大教育", type: "prelim" },
  { sport: "籃球", date: "12/6", stage: "複賽 / 決賽", time: "08:30", duration: 50, venue: "籃球場 一", teamA: "A冠", teamB: "B冠", type: "final" },
  { sport: "籃球", date: "12/6", stage: "複賽 / 決賽", time: "09:30", duration: 50, venue: "籃球場 一", teamA: "C冠", teamB: "D冠", type: "final" },
  { sport: "籃球", date: "12/6", stage: "複賽 / 決賽", time: "11:00", duration: 50, venue: "籃球場 一", teamA: "季殿賽", teamB: "", type: "final" },
  { sport: "籃球", date: "12/6", stage: "複賽 / 決賽", time: "12:00", duration: 50, venue: "籃球場 一", teamA: "冠亞賽", teamB: "", type: "final" },

  // ================= 排球（12/5 真理大學體育館｜12/6 淡江大學紹謨體育館4樓） =================
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "08:00", duration: 50, venue: "室內場地一", teamA: "1 暨南大學", teamB: "2 彰師大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "08:00", duration: 50, venue: "室內場地二", teamA: "3 臺北教大（教育）", teamB: "4 屏東大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "09:00", duration: 50, venue: "室內場地一", teamA: "5 清華大學", teamB: "6 淡江大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "09:00", duration: 50, venue: "室內場地二", teamA: "7 高師大", teamB: "8 臺南大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "10:00", duration: 50, venue: "室內場地一", teamA: "9 臺中教大", teamB: "10 中正大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "10:00", duration: 50, venue: "室內場地二", teamA: "12 政治大學", teamB: "13 嘉義大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "11:00", duration: 50, venue: "室內場地一", teamA: "1 暨南大學", teamB: "3 臺北教大（教育）", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "11:00", duration: 50, venue: "室內場地二", teamA: "2 彰師大", teamB: "4 屏東大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "12:00", duration: 50, venue: "室內場地一", teamA: "5 清華大學", teamB: "7 高師大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "12:00", duration: 50, venue: "室內場地二", teamA: "6 淡江大學", teamB: "8 臺南大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "13:00", duration: 50, venue: "室內場地一", teamA: "9 臺中教大", teamB: "11 臺北教大（教經管）", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "13:00", duration: 50, venue: "室內場地二", teamA: "1 臺中教大", teamB: "2 政治大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "14:00", duration: 50, venue: "室內場地一", teamA: "12 政治大學", teamB: "14 北市大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "14:00", duration: 50, venue: "室內場地二", teamA: "5 臺南大學", teamB: "6 清華大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "15:00", duration: 50, venue: "室內場地一", teamA: "1 暨南大學", teamB: "4 屏東大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "15:00", duration: 50, venue: "室內場地二", teamA: "3 臺北教大", teamB: "4 嘉義大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "16:00", duration: 50, venue: "室內場地一", teamA: "2 彰師大", teamB: "3 臺北教大（教育）", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "16:00", duration: 50, venue: "室內場地二", teamA: "8 北市大", teamB: "9 台灣師大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "17:00", duration: 50, venue: "室內場地一", teamA: "5 清華大學", teamB: "8 臺南大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "17:00", duration: 50, venue: "室內場地二", teamA: "1 臺中教大", teamB: "3 臺北教大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "18:00", duration: 50, venue: "室內場地一", teamA: "6 淡江大學", teamB: "7 高師大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "18:00", duration: 50, venue: "室內場地二", teamA: "2 政治大學", teamB: "4 嘉義大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "19:00", duration: 50, venue: "室內場地一", teamA: "10 中正大學", teamB: "11 臺北教大（教經管）", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "19:00", duration: 50, venue: "室內場地二", teamA: "5 臺南大學", teamB: "7 台東大學", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "女排・預賽（12/5）", time: "20:00", duration: 50, venue: "室內場地一", teamA: "13 嘉義大學", teamB: "14 北市大", type: "prelim" },
  { sport: "排球", date: "12/5", stage: "男排・預賽（12/5）", time: "20:00", duration: 50, venue: "室內場地二", teamA: "8 北市大", teamB: "10 台北教大（教經管）", type: "prelim" },

  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "08:00", duration: 50, venue: "女排場地", teamA: "A組冠軍", teamB: "D組亞軍【W-Q1】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "08:00", duration: 50, venue: "男排場地一", teamA: "1 臺中教大", teamB: "4 嘉義大學【M-G09】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "09:00", duration: 50, venue: "女排場地", teamA: "B組冠軍", teamB: "C組亞軍【W-Q2】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "09:00", duration: 50, venue: "男排場地一", teamA: "6 清華大學", teamB: "7 台東大學【M-G10】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "10:00", duration: 50, venue: "女排場地", teamA: "C組冠軍", teamB: "B組亞軍【W-Q3】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "10:00", duration: 50, venue: "男排場地一", teamA: "2 政治大學", teamB: "3 臺北教大【M-G11】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "11:00", duration: 50, venue: "女排場地", teamA: "D組冠軍", teamB: "A組亞軍【W-Q4】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "11:00", duration: 50, venue: "男排場地一", teamA: "9 台灣師大", teamB: "10 台北教大（教經管）【M-G12】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "12:00", duration: 50, venue: "女排場地", teamA: "W-Q1勝隊", teamB: "W-Q2勝隊【W-S1】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "12:00", duration: 50, venue: "男排場地一", teamA: "晉級席次1", teamB: "晉級席次2【M-R1】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "13:00", duration: 50, venue: "女排場地", teamA: "W-Q3勝隊", teamB: "W-Q4勝隊【W-S2】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "13:00", duration: 50, venue: "男排場地一", teamA: "晉級席次5", teamB: "晉級席次6【M-R2】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "14:00", duration: 50, venue: "女排場地", teamA: "W-S1敗隊", teamB: "W-S2敗隊【W-3】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "14:00", duration: 50, venue: "男排場地一", teamA: "M-R1勝隊", teamB: "晉級席次3【M-S1】", type: "final" },
  { sport: "排球", date: "12/6", stage: "女排・淘汰/決賽（12/6）", time: "15:00", duration: 50, venue: "女排場地", teamA: "W-S1勝隊", teamB: "W-S2勝隊【W-F】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "15:00", duration: 50, venue: "男排場地一", teamA: "晉級席次4", teamB: "M-R2勝隊【M-S2】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "16:00", duration: 50, venue: "男排場地一", teamA: "M-S1敗隊", teamB: "M-S2敗隊【M-3】", type: "final" },
  { sport: "排球", date: "12/6", stage: "男排・淘汰/決賽（12/6）", time: "16:00", duration: 50, venue: "男排場地二", teamA: "M-S1勝隊", teamB: "M-S2勝隊【M-F】", type: "final" },

  // ================= 羽球（12/5｜淡江大學紹謨體育館4樓） =================
  { sport: "羽球", date: "12/5", stage: "預賽", time: "08:00", duration: 70, venue: "羽球場 一", teamA: "北教大A", teamB: "東華教行", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "08:00", duration: 70, venue: "羽球場 二", teamA: "台南大學", teamB: "東華教育", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "08:00", duration: 70, venue: "羽球場 三", teamA: "清華大學A", teamB: "台師大", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "08:00", duration: 70, venue: "羽球場 四", teamA: "中正大學", teamB: "政治", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "09:20", duration: 70, venue: "羽球場 一", teamA: "北市大", teamB: "清華大學B", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "09:20", duration: 70, venue: "羽球場 二", teamA: "北教大A", teamB: "台南大學", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "09:20", duration: 70, venue: "羽球場 三", teamA: "東華教行", teamB: "東華教育", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "09:20", duration: 70, venue: "羽球場 四", teamA: "清華大學A", teamB: "北教大B", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "10:40", duration: 70, venue: "羽球場 一", teamA: "中正大學", teamB: "北教大教經", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "10:40", duration: 70, venue: "羽球場 二", teamA: "北市大", teamB: "台中教育大學", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "10:40", duration: 70, venue: "羽球場 三", teamA: "北教大A", teamB: "東華教育", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "10:40", duration: 70, venue: "羽球場 四", teamA: "東華教行", teamB: "台南大學", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "12:00", duration: 70, venue: "羽球場 一", teamA: "台師大", teamB: "北教大B", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "12:00", duration: 70, venue: "羽球場 二", teamA: "政治大學", teamB: "北教大教經", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "預賽", time: "12:00", duration: 70, venue: "羽球場 三", teamA: "清華教科B", teamB: "台中教育大學", type: "prelim" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "13:20", duration: 70, venue: "羽球場 一", teamA: "A冠", teamB: "D亞", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "13:20", duration: 70, venue: "羽球場 二", teamA: "B冠", teamB: "C亞", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "13:20", duration: 70, venue: "羽球場 三", teamA: "C冠", teamB: "B亞", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "13:20", duration: 70, venue: "羽球場 四", teamA: "D冠", teamB: "A亞", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "14:40", duration: 70, venue: "羽球場 一", teamA: "四強賽 一", teamB: "", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "14:40", duration: 70, venue: "羽球場 二", teamA: "四強賽 二", teamB: "", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "16:00", duration: 70, venue: "羽球場 一", teamA: "季殿賽", teamB: "", type: "final" },
  { sport: "羽球", date: "12/5", stage: "複賽 / 決賽", time: "16:00", duration: 70, venue: "羽球場 二", teamA: "冠亞賽", teamB: "", type: "final" }
];

window.SCHEDULE_DATA = RAW_SCHEDULE_DATA.map((item) => ({
  ...item,
  location: resolveLocation(item.sport, item.date)
}));