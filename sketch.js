// =====================================================
// 全國教育盃賽程查詢系統
// 直式時間軸版本：依時間排列，同時段賽事並列
// =====================================================

const ALL_DATA = window.SCHEDULE_DATA || [];

const SPORT_LOCATION_SUMMARY = {
  籃球: "場地：淡江大學紹謨體育館7樓（預賽 12/5｜複賽/決賽 12/6）",
  排球: "場地：12/5 真理大學體育館｜12/6 淡江大學紹謨體育館4樓",
  羽球: "場地：淡江大學紹謨體育館4樓（12/5）"
};

const state = {
  sport: "籃球",
  date: "ALL",
  stage: "ALL",
  venue: "ALL",
  keyword: "",
  selectedMatch: null
};

let filteredMatches = [];
let allSportMatches = [];

// =====================================================
// 基本工具函式
// =====================================================

function timeToMinutes(time) {
  if (!time || !time.includes(":")) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatFullTitle(match) {
  return match.teamB ? `${match.teamA} vs ${match.teamB}` : match.teamA;
}

function formatEndTime(match) {
  if (!match.duration) return "";
  const endMinutes = timeToMinutes(match.time) + Number(match.duration);
  const hours = Math.floor(endMinutes / 60);
  const minutes = endMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getDateNumber(date) {
  const match = String(date || "").match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return 0;
  return Number(match[1]) * 100 + Number(match[2]);
}

function sortMatches(a, b) {
  const dateDiff = getDateNumber(a.date) - getDateNumber(b.date);
  if (dateDiff !== 0) return dateDiff;
  return timeToMinutes(a.time) - timeToMinutes(b.time);
}

function hasActiveFilters() {
  return (
    state.stage !== "ALL" ||
    state.venue !== "ALL" ||
    state.keyword.length > 0
  );
}

// =====================================================
// 初始化
// =====================================================

window.addEventListener("DOMContentLoaded", () => {
  // 主分頁切換（賽程查詢 / 大會資訊與聯絡）
  document.querySelectorAll(".page-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.page;
      document.querySelectorAll(".page-tab-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      document.querySelectorAll(".page-section").forEach((section) => {
        section.classList.toggle("active", section.id === targetId);
      });
    });
  });

  // 球類切換
  document.querySelectorAll(".sport-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sport = btn.dataset.sport;
      state.date = "ALL";
      state.stage = "ALL";
      state.venue = "ALL";
      state.selectedMatch = null;

      document.querySelectorAll(".sport-tab").forEach((b) => {
        b.classList.toggle("active", b.dataset.sport === state.sport);
      });

      populateDropdowns();
      updateDateButtons();
      updateSportLocationBanner();
      applyFilters();
      setSelectedMatch(null);
    });
  });

  // 階段篩選
  const stageSelect = document.getElementById("stage-select");
  if (stageSelect) {
    stageSelect.addEventListener("change", (event) => {
      state.stage = event.target.value;
      applyFilters();
    });
  }

  // 場地篩選
  const venueSelect = document.getElementById("venue-select");
  if (venueSelect) {
    venueSelect.addEventListener("change", (event) => {
      state.venue = event.target.value;
      applyFilters();
    });
  }

  // 隊伍搜尋（輸入關鍵字時跨日期搜尋，方便找到第二天賽程）
  const teamSearch = document.getElementById("team-search");
  if (teamSearch) {
    teamSearch.addEventListener("input", (event) => {
      state.keyword = event.target.value.trim().toLowerCase();
      updateDateButtons();
      applyFilters();
    });
  }

  // 重設篩選
  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }

  // 關閉詳細資訊
  const detailClose = document.getElementById("detail-close");
  if (detailClose) {
    detailClose.addEventListener("click", () => {
      setSelectedMatch(null);
    });
  }

  populateDropdowns();
  updateDateButtons();
  updateSportLocationBanner();
  applyFilters();
});

function resetAllFilters() {
  state.stage = "ALL";
  state.venue = "ALL";
  state.keyword = "";

  const stageSelect = document.getElementById("stage-select");
  const venueSelect = document.getElementById("venue-select");
  const teamSearch = document.getElementById("team-search");

  if (stageSelect) stageSelect.value = "ALL";
  if (venueSelect) venueSelect.value = "ALL";
  if (teamSearch) teamSearch.value = "";

  updateDateButtons();
  applyFilters();
}

// =====================================================
// 日期切換按鈕（支援「全部日期」與各日切換）
// =====================================================

function updateDateButtons() {
  const toolbar = document.getElementById("date-switcher");
  if (!toolbar) return;

  const dates = Array.from(
    new Set(
      ALL_DATA
        .filter((match) => match.sport === state.sport)
        .map((match) => match.date)
    )
  ).sort((a, b) => getDateNumber(a) - getDateNumber(b));

  if (state.date !== "ALL" && !dates.includes(state.date)) {
    state.date = dates[0] || "ALL";
  }

  // 初次載入且無關鍵字搜尋時，若有多天賽程預設選第一天
  if (!toolbar.dataset.initialized && dates.length > 0) {
    state.date = dates[0];
    toolbar.dataset.initialized = "true";
  }

  toolbar.innerHTML = "";

  const options = dates.length > 1 ? ["ALL", ...dates] : dates;

  options.forEach((dateVal) => {
    const button = document.createElement("button");
    button.type = "button";
    const isAllMode = state.keyword.length > 0 && dateVal === "ALL";
    const isActive = state.keyword.length > 0
      ? dateVal === "ALL"
      : state.date === dateVal;

    button.className = "date-switch-btn" + (isActive ? " active" : "");
    button.textContent = dateVal === "ALL" ? "全部日期" : dateVal;

    if (isAllMode) {
      button.title = "搜尋隊伍時自動跨日期顯示";
    }

    button.addEventListener("click", () => {
      state.date = dateVal;
      state.selectedMatch = null;
      updateDateButtons();
      applyFilters();
      setSelectedMatch(null);
    });

    toolbar.appendChild(button);
  });
}

// =====================================================
// 更新運動項目場地說明
// =====================================================

function updateSportLocationBanner() {
  const summary = SPORT_LOCATION_SUMMARY[state.sport] || "";
  const desc = document.getElementById("timeline-location-desc");
  if (desc) {
    desc.textContent =
      `${summary}；時間由上往下排列，同一時段的不同場地賽事會並列顯示。點擊賽事卡片可查看完整資訊。`;
  }
}

// =====================================================
// 下拉選單
// =====================================================

function populateDropdowns() {
  const sportItems = ALL_DATA.filter((match) => match.sport === state.sport);
  const stages = Array.from(new Set(sportItems.map((match) => match.stage)));
  const venues = Array.from(new Set(sportItems.map((match) => match.venue)));

  const stageSelect = document.getElementById("stage-select");
  if (stageSelect) {
    stageSelect.innerHTML = `<option value="ALL">全部賽事階段</option>`;
    stages.forEach((stage) => {
      const option = document.createElement("option");
      option.value = stage;
      option.textContent = stage;
      stageSelect.appendChild(option);
    });
    stageSelect.value = "ALL";
  }

  const venueSelect = document.getElementById("venue-select");
  if (venueSelect) {
    venueSelect.innerHTML = `<option value="ALL">全部場地</option>`;
    venues.forEach((venue) => {
      const option = document.createElement("option");
      option.value = venue;
      option.textContent = venue;
      venueSelect.appendChild(option);
    });
    venueSelect.value = "ALL";
  }
}

// =====================================================
// 篩選賽程
// =====================================================

function applyFilters() {
  allSportMatches = ALL_DATA.filter((match) => match.sport === state.sport);

  // 輸入搜尋關鍵字時自動跨日期比對，避免隊伍在第二天出賽卻被第一天日期遮蔽
  const effectiveDate = state.keyword.length > 0 ? "ALL" : state.date;

  filteredMatches = allSportMatches.filter((match) => {
    if (effectiveDate !== "ALL" && match.date !== effectiveDate) {
      return false;
    }
    if (state.stage !== "ALL" && match.stage !== state.stage) {
      return false;
    }
    if (state.venue !== "ALL" && match.venue !== state.venue) {
      return false;
    }
    if (state.keyword) {
      const text = [
        match.teamA,
        match.teamB,
        match.venue,
        match.location,
        match.stage,
        match.time,
        match.date,
        match.sport
      ].join(" ").toLowerCase();

      if (!text.includes(state.keyword)) {
        return false;
      }
    }
    return true;
  });

  filteredMatches.sort(sortMatches);

  if (state.selectedMatch && !filteredMatches.includes(state.selectedMatch)) {
    setSelectedMatch(null);
  }

  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.hidden = !hasActiveFilters();
  }

  const uniqueVenues = new Set(filteredMatches.map((match) => match.venue));
  const sportKpi = document.getElementById("kpi-sport");
  const countKpi = document.getElementById("kpi-count");
  const venuesKpi = document.getElementById("kpi-venues");
  const listCounter = document.getElementById("list-counter");

  if (sportKpi) sportKpi.textContent = state.sport;
  if (countKpi) countKpi.textContent = filteredMatches.length;
  if (venuesKpi) venuesKpi.textContent = uniqueVenues.size;

  const baseCount = allSportMatches.filter(
    (match) => effectiveDate === "ALL" || match.date === effectiveDate
  ).length;

  if (listCounter) {
    listCounter.textContent = `顯示 ${filteredMatches.length} / ${baseCount} 筆`;
  }

  renderVerticalTimeline();
  renderScheduleList();
}

// =====================================================
// 繪製直式時間軸
// =====================================================

function renderVerticalTimeline() {
  const timeline = document.getElementById("vertical-timeline");
  if (!timeline) return;

  timeline.innerHTML = "";

  if (filteredMatches.length === 0) {
    timeline.innerHTML = `
      <div class="timeline-empty">
        <div>查無符合條件的賽程資料</div>
        ${hasActiveFilters() ? '<button type="button" class="empty-reset-btn" id="timeline-empty-reset">重設篩選條件</button>' : ""}
      </div>
    `;
    const btn = document.getElementById("timeline-empty-reset");
    if (btn) btn.addEventListener("click", resetAllFilters);
    return;
  }

  // 依「日期 + 開始時間」分組，支援跨日檢視
  const dateTimeGroups = new Map();

  filteredMatches.forEach((match) => {
    const key = `${match.date}__${match.time}`;
    if (!dateTimeGroups.has(key)) {
      dateTimeGroups.set(key, {
        date: match.date,
        time: match.time,
        matches: []
      });
    }
    dateTimeGroups.get(key).matches.push(match);
  });

  const sortedGroups = Array.from(dateTimeGroups.values()).sort((a, b) => {
    const dateDiff = getDateNumber(a.date) - getDateNumber(b.date);
    if (dateDiff !== 0) return dateDiff;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  const showDateDivider = new Set(sortedGroups.map((g) => g.date)).size > 1;
  let renderedDate = null;

  sortedGroups.forEach(({ date, time, matches }) => {
    if (showDateDivider && date !== renderedDate) {
      renderedDate = date;
      const divider = document.createElement("div");
      divider.className = "timeline-date-divider";
      divider.textContent = `${date} 賽程`;
      timeline.appendChild(divider);
    }

    const group = document.createElement("div");
    group.className = "timeline-time-group";

    const timeLabel = document.createElement("div");
    timeLabel.className = "timeline-time-label";
    timeLabel.textContent = time;

    const matchArea = document.createElement("div");
    matchArea.className = "timeline-match-grid";

    matches.forEach((match) => {
      const card = document.createElement("button");
      const type = match.type || "prelim";

      card.type = "button";
      card.className = `timeline-match-card ${type}`;
      if (state.selectedMatch === match) {
        card.classList.add("selected");
      }

      const endTime = formatEndTime(match);

      card.innerHTML = `
        <div class="timeline-card-top">
          <span class="timeline-stage-tag">${escapeHtml(match.stage)}</span>
          <span class="timeline-venue-tag">${escapeHtml(match.venue)}</span>
          <span class="timeline-time-range">${escapeHtml(match.time)}${endTime ? `–${escapeHtml(endTime)}` : ""}</span>
        </div>
        <div class="timeline-match-teams">${escapeHtml(formatFullTitle(match))}</div>
        <div class="timeline-match-location">${escapeHtml(match.location)}</div>
      `;

      card.addEventListener("click", () => {
        setSelectedMatch(match, true);
      });

      matchArea.appendChild(card);
    });

    group.appendChild(timeLabel);
    group.appendChild(matchArea);
    timeline.appendChild(group);
  });
}

// =====================================================
// 賽事詳細資訊
// =====================================================

function setSelectedMatch(match, shouldScroll = false) {
  if (!match || state.selectedMatch === match) {
    state.selectedMatch = null;
  } else {
    state.selectedMatch = match;
  }

  const box = document.getElementById("selected-detail");
  if (box) {
    if (!state.selectedMatch) {
      box.classList.remove("show");
    } else {
      const selected = state.selectedMatch;
      const detailMeta = document.getElementById("detail-meta");
      const detailTitle = document.getElementById("detail-title");

      if (detailMeta) {
        detailMeta.textContent =
          `日期：${selected.date} ｜ ` +
          `場地：${selected.location} ｜ ` +
          `球類：${selected.sport} ｜ ` +
          `階段：${selected.stage} ｜ ` +
          `時間：${selected.time} ｜ ` +
          `場區：${selected.venue}`;
      }

      if (detailTitle) {
        detailTitle.textContent = formatFullTitle(selected);
      }

      box.classList.add("show");

      if (shouldScroll) {
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  renderVerticalTimeline();
  renderScheduleList();
}

// =====================================================
// 下方完整賽程列表
// =====================================================

function renderScheduleList() {
  const container = document.getElementById("schedule-list");
  if (!container) return;

  container.innerHTML = "";

  if (filteredMatches.length === 0) {
    container.innerHTML = `
      <div class="empty-schedule">
        <div>查無符合條件的賽程資料</div>
        ${hasActiveFilters() ? '<button type="button" class="empty-reset-btn" id="list-empty-reset">重設篩選條件</button>' : ""}
      </div>
    `;
    const btn = document.getElementById("list-empty-reset");
    if (btn) btn.addEventListener("click", resetAllFilters);
    return;
  }

  let currentDate = null;
  let currentRowsWrapper = null;

  filteredMatches.forEach((match) => {
    if (match.date !== currentDate) {
      currentDate = match.date;

      const dateTitle = document.createElement("div");
      dateTitle.className = "stage-group-title";
      dateTitle.textContent = `${currentDate} 賽程`;
      container.appendChild(dateTitle);

      currentRowsWrapper = document.createElement("div");
      currentRowsWrapper.className = "stage-rows";
      container.appendChild(currentRowsWrapper);
    }

    const row = document.createElement("button");
    row.type = "button";
    row.className = `match-row ${match.type || "prelim"}`;

    if (state.selectedMatch === match) {
      row.classList.add("selected");
    }

    const badges = document.createElement("div");
    badges.className = "match-badges";
    badges.innerHTML = `
      <span class="badge-time">${escapeHtml(match.time)}</span>
      <span class="badge-location">${escapeHtml(match.location)}</span>
      <span class="badge-venue">${escapeHtml(match.venue)}</span>
      <span class="badge-date">${escapeHtml(match.stage)}</span>
    `;

    const teams = document.createElement("div");
    teams.className = "match-teams";
    teams.textContent = formatFullTitle(match);

    row.appendChild(badges);
    row.appendChild(teams);

    row.addEventListener("click", () => {
      setSelectedMatch(match, true);
    });

    currentRowsWrapper.appendChild(row);
  });
}