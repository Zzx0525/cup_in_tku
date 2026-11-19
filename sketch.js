// 讀取外部 scheduleData.js 的資料
const ALL_DATA = window.SCHEDULE_DATA || [];

const state = {
  sport: "籃球",
  stage: "ALL",
  venue: "ALL",
  keyword: "",
  selectedMatch: null
};

const COLORS = {
  prelim: "#1976a3",     // 藍色（預賽）
  final: "#d97336",      // 橘色（複賽 / 決賽）
  rest: "#9aa5b1",       // 灰色（休息 / 待定）
  gridLine: "#e6edf3",
  axisText: "#5a6d82",
  labelText: "#23374d"
};

let filteredMatches = [];
let allSportMatches = [];
let timelineSketch = null;
let listSketch = null;

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatFullTitle(m) {
  return m.teamB ? `${m.teamA} vs ${m.teamB}` : m.teamA;
}

function formatCompactLabel(m) {
  const shortTitle = m.teamB ? `${m.teamA}/${m.teamB}` : m.teamA;
  return `${m.time} ${shortTitle}`;
}

function setSelectedMatch(match) {
  if (!match || state.selectedMatch === match) {
    state.selectedMatch = null;
  } else {
    state.selectedMatch = match;
  }

  const box = document.getElementById("selected-detail");
  if (!state.selectedMatch) {
    box.classList.remove("show");
    return;
  }

  const m = state.selectedMatch;
  document.getElementById("detail-meta").textContent =
    `日期：${m.date} ｜ 球類：${m.sport} ｜ 階段：${m.stage} ｜ 時間：${m.time} ｜ 場地：${m.venue}`;
  document.getElementById("detail-title").textContent = formatFullTitle(m);
  box.classList.add("show");
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".sport-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sport = btn.dataset.sport;
      state.stage = "ALL";
      state.venue = "ALL";
      setSelectedMatch(null);
      document.querySelectorAll(".sport-tab").forEach((b) => {
        b.classList.toggle("active", b.dataset.sport === state.sport);
      });
      populateDropdowns();
      applyFilters();
    });
  });

  document.getElementById("stage-select").addEventListener("change", (e) => {
    state.stage = e.target.value;
    applyFilters();
  });

  document.getElementById("venue-select").addEventListener("change", (e) => {
    state.venue = e.target.value;
    applyFilters();
  });

  document.getElementById("team-search").addEventListener("input", (e) => {
    state.keyword = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  document.getElementById("detail-close").addEventListener("click", () => {
    setSelectedMatch(null);
  });

  populateDropdowns();
  initSketches();
  applyFilters();
});

function populateDropdowns() {
  const sportItems = ALL_DATA.filter((d) => d.sport === state.sport);
  const stages = Array.from(new Set(sportItems.map((d) => d.stage)));
  const venues = Array.from(new Set(sportItems.map((d) => d.venue)));

  const stageSel = document.getElementById("stage-select");
  stageSel.innerHTML = `<option value="ALL">全部賽事階段</option>`;
  stages.forEach((st) => {
    const opt = document.createElement("option");
    opt.value = st;
    opt.textContent = st;
    stageSel.appendChild(opt);
  });

  const venueSel = document.getElementById("venue-select");
  venueSel.innerHTML = `<option value="ALL">全部場地</option>`;
  venues.forEach((vn) => {
    const opt = document.createElement("option");
    opt.value = vn;
    opt.textContent = vn;
    venueSel.appendChild(opt);
  });
}

function applyFilters() {
  allSportMatches = ALL_DATA.filter((d) => d.sport === state.sport);

  filteredMatches = allSportMatches.filter((m) => {
    if (state.stage !== "ALL" && m.stage !== state.stage) return false;
    if (state.venue !== "ALL" && m.venue !== state.venue) return false;
    if (state.keyword) {
      const text = `${m.teamA} ${m.teamB} ${m.venue} ${m.stage} ${m.time} ${m.date}`.toLowerCase();
      if (!text.includes(state.keyword)) return false;
    }
    return true;
  });

  filteredMatches.sort((a, b) => {
    if (a.stage !== b.stage) return a.stage.localeCompare(b.stage, "zh-Hant");
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  const uniqueVenues = new Set(filteredMatches.map((m) => m.venue));
  document.getElementById("kpi-sport").textContent = state.sport;
  document.getElementById("kpi-count").textContent = filteredMatches.length;
  document.getElementById("kpi-venues").textContent = uniqueVenues.size;
  document.getElementById("list-counter").textContent =
    `顯示 ${filteredMatches.length} / ${allSportMatches.length} 筆`;

  if (timelineSketch) timelineSketch.updateLayout();
  if (listSketch) listSketch.updateLayout();
}

function initSketches() {
  // ==========================================
  // 畫布 1：無重疊簡潔時間軸
  // ==========================================
  timelineSketch = new p5((p) => {
    const START_HOUR = 7;
    const END_HOUR = 18;
    const LEFT_MARGIN = 105;
    const RIGHT_MARGIN = 20;
    const TOP_MARGIN = 36;
    const LANE_H = 30;
    const LANE_GAP = 5;
    const ROW_PAD = 18;
    const BOTTOM_MARGIN = 20;

    let venues = [];
    let venueRows = []; // { name, yTop, height, blocks }
    let hitBoxes = [];

    function computeVenueRows(plotW) {
      const totalMinutes = (END_HOUR - START_HOUR) * 60;
      const rows = [];
      let currentY = TOP_MARGIN;

      venues.forEach((venueName) => {
        const items = filteredMatches
          .filter((m) => m.venue === venueName)
          .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        // 計算每個區塊的 x 與寬度，並指派不重疊的 lane（層）
        const laneEndX = []; // 每層目前佔用到的最右邊 x 座標
        const blocks = [];

        items.forEach((m) => {
          const startMin = timeToMinutes(m.time) - START_HOUR * 60;
          if (startMin < 0 || startMin > totalMinutes) return;

          const x = LEFT_MARGIN + (startMin / totalMinutes) * plotW;
          const rawW = (m.duration / totalMinutes) * plotW;
          const pillW = Math.max(66, Math.min(rawW, plotW * 0.14));

          // 找第一個不會與現有區塊重疊的 lane（留 4px 間距）
          let assignedLane = -1;
          for (let l = 0; l < laneEndX.length; l++) {
            if (x >= laneEndX[l] + 4) {
              assignedLane = l;
              laneEndX[l] = x + pillW;
              break;
            }
          }
          if (assignedLane === -1) {
            assignedLane = laneEndX.length;
            laneEndX.push(x + pillW);
          }

          blocks.push({
            match: m,
            x,
            w: pillW,
            h: 26,
            lane: assignedLane
          });
        });

        const laneCount = Math.max(1, laneEndX.length);
        const rowH = Math.max(54, laneCount * LANE_H + (laneCount - 1) * LANE_GAP + ROW_PAD);

        rows.push({
          name: venueName,
          yTop: currentY,
          height: rowH,
          blocks
        });

        currentY += rowH;
      });

      return { rows, totalHeight: Math.max(150, currentY + BOTTOM_MARGIN) };
    }

    p.setup = () => {
      const holder = document.getElementById("timeline-canvas-holder");
      const w = holder.clientWidth || 1100;
      const cnv = p.createCanvas(w, 200);
      cnv.parent("timeline-canvas-holder");
      p.textFont("sans-serif");
    };

    p.windowResized = () => {
      p.updateLayout();
    };

    p.updateLayout = () => {
      const holder = document.getElementById("timeline-canvas-holder");
      const w = holder.clientWidth || 1100;
      venues =
        state.venue === "ALL"
          ? Array.from(new Set(allSportMatches.map((m) => m.venue)))
          : [state.venue];

      const plotW = Math.max(400, w - LEFT_MARGIN - RIGHT_MARGIN);
      const layout = computeVenueRows(plotW);
      venueRows = layout.rows;
      p.resizeCanvas(w, layout.totalHeight);
    };

    p.mousePressed = () => {
      for (let i = hitBoxes.length - 1; i >= 0; i--) {
        const b = hitBoxes[i];
        if (p.mouseX >= b.x && p.mouseX <= b.x + b.w && p.mouseY >= b.y && p.mouseY <= b.y + b.h) {
          setSelectedMatch(b.match);
          return;
        }
      }
    };

    p.draw = () => {
      p.background("#ffffff");
      hitBoxes = [];

      const plotW = Math.max(400, p.width - LEFT_MARGIN - RIGHT_MARGIN);
      const totalGridBottom =
        venueRows.length > 0
          ? venueRows[venueRows.length - 1].yTop + venueRows[venueRows.length - 1].height
          : TOP_MARGIN + 54;

      p.stroke(COLORS.gridLine);
      p.strokeWeight(1);
      p.line(0, 6, p.width, 6);

      // 整點刻度線 (07:00 ~ 18:00)
      for (let hr = START_HOUR; hr <= END_HOUR; hr++) {
        const x = LEFT_MARGIN + ((hr - START_HOUR) / (END_HOUR - START_HOUR)) * plotW;
        p.stroke(COLORS.gridLine);
        p.line(x, TOP_MARGIN - 6, x, totalGridBottom);

        p.noStroke();
        p.fill(COLORS.axisText);
        p.textSize(11.5);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(`${String(hr).padStart(2, "0")}:00`, x, TOP_MARGIN - 10);
      }

      // 場地列與各層區塊
      venueRows.forEach((row) => {
        const yBottom = row.yTop + row.height;

        p.stroke(COLORS.gridLine);
        p.line(LEFT_MARGIN, yBottom, p.width - RIGHT_MARGIN, yBottom);

        p.noStroke();
        p.fill(COLORS.labelText);
        p.textSize(13);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(row.name.replace(" ", ""), LEFT_MARGIN - 14, row.yTop + row.height / 2);

        row.blocks.forEach((blk) => {
          const y = row.yTop + ROW_PAD / 2 + blk.lane * (LANE_H + LANE_GAP);
          const isSelected = state.selectedMatch === blk.match;
          const isHover =
            p.mouseX >= blk.x &&
            p.mouseX <= blk.x + blk.w &&
            p.mouseY >= y &&
            p.mouseY <= y + blk.h;

          hitBoxes.push({ match: blk.match, x: blk.x, y, w: blk.w, h: blk.h });

          const fillHex = COLORS[blk.match.type] || COLORS.prelim;
          if (isSelected || isHover) {
            p.stroke("#092236");
            p.strokeWeight(1.8);
          } else {
            p.noStroke();
          }
          p.fill(fillHex);
          p.rect(blk.x, y, blk.w, blk.h, 6);

          p.noStroke();
          p.fill("#ffffff");
          p.textSize(10.5);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(
            fitText(p, formatCompactLabel(blk.match), blk.w - 8),
            blk.x + blk.w / 2,
            y + blk.h / 2 + 0.5
          );
        });
      });
    };

    function fitText(pInst, str, maxW) {
      if (pInst.textWidth(str) <= maxW) return str;
      let s = str;
      while (s.length > 1 && pInst.textWidth(s + "…") > maxW) {
        s = s.slice(0, -1);
      }
      return s + "…";
    }
  });

  // ==========================================
  // 畫布 2：完整賽程列表
  // ==========================================
  listSketch = new p5((p) => {
    const ROW_H = 52;
    const GROUP_HEADER_H = 38;
    const GAP = 8;
    let layoutItems = [];

    p.setup = () => {
      const holder = document.getElementById("list-canvas-holder");
      const w = holder.clientWidth || 1100;
      const cnv = p.createCanvas(w, 200);
      cnv.parent("list-canvas-holder");
      p.textFont("sans-serif");
    };

    p.windowResized = () => {
      p.updateLayout();
    };

    p.updateLayout = () => {
      const holder = document.getElementById("list-canvas-holder");
      const w = holder.clientWidth || 1100;

      layoutItems = [];
      let y = 6;
      let currentStage = null;

      filteredMatches.forEach((m) => {
        if (m.stage !== currentStage) {
          currentStage = m.stage;
          layoutItems.push({ kind: "header", title: currentStage, y });
          y += GROUP_HEADER_H;
        }
        layoutItems.push({ kind: "row", match: m, y });
        y += ROW_H + GAP;
      });

      const totalH = filteredMatches.length === 0 ? 110 : y + 6;
      p.resizeCanvas(w, totalH);
    };

    p.draw = () => {
      p.background("#ffffff");

      if (filteredMatches.length === 0) {
        p.noStroke();
        p.fill("#6b7c8f");
        p.textSize(14);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("查無符合條件的賽程資料", p.width / 2, p.height / 2);
        return;
      }

      layoutItems.forEach((item) => {
        if (item.kind === "header") {
          p.noStroke();
          p.fill("#16689c");
          p.textSize(14);
          p.textStyle(p.BOLD);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(item.title, 4, item.y + GROUP_HEADER_H / 2);
          p.textStyle(p.NORMAL);
          return;
        }

        const m = item.match;
        const x = 2;
        const y = item.y;
        const w = p.width - 4;
        const h = ROW_H;
        const hover =
          p.mouseX >= x && p.mouseX <= x + w && p.mouseY >= y && p.mouseY <= y + h;

        p.stroke(hover ? "#1976a3" : "#e2eaf1");
        p.strokeWeight(hover ? 1.5 : 1);
        p.fill(hover ? "#f5faff" : "#fafcfe");
        p.rect(x, y, w, h, 10);

        p.noStroke();
        p.fill(COLORS[m.type] || COLORS.prelim);
        p.rect(x, y, 5, h, 10, 0, 0, 10);

        p.fill("#e8f2fa");
        p.rect(x + 18, y + 12, 66, 28, 7);
        p.fill("#0f4c75");
        p.textSize(13);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(m.time, x + 51, y + 26);

        p.fill("#eef3f7");
        p.rect(x + 96, y + 12, 92, 28, 7);
        p.fill("#3d5166");
        p.textStyle(p.NORMAL);
        p.text(m.venue, x + 142, y + 26);

        p.fill("#162436");
        p.textSize(15);
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(formatFullTitle(m), x + 206, y + 26);
        p.textStyle(p.NORMAL);
      });
    };
  });
}