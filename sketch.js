// 讀取外部 scheduleData.js 的資料
const ALL_DATA = window.SCHEDULE_DATA || [];

const SPORT_LOCATION_SUMMARY = {
  籃球: "淡江大學紹謨體育館7樓",
  排球: "12/5 真理大學體育館｜12/6 淡江大學紹謨體育館4樓",
  羽球: "淡江大學紹謨體育館4樓（12/5）"
};

const state = {
  sport: "籃球",
  date: "12/5",
  stage: "ALL",
  venue: "ALL",
  keyword: "",
  selectedMatch: null
};

let filteredMatches = [];
let allSportMatches = [];

function timeToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function formatFullTitle(match) {
  return match.teamB ? `${match.teamA} vs ${match.teamB}` : match.teamA;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".page-tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.page;
      document.querySelectorAll(".page-tab-btn").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      document.querySelectorAll(".page-section").forEach((section) => {
        section.classList.toggle("active", section.id === targetId);
      });
    });
  });

  document.querySelectorAll(".sport-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.sport = button.dataset.sport;
      state.stage = "ALL";
      state.venue = "ALL";
      state.keyword = "";
      document.getElementById("team-search").value = "";
      setSelectedMatch(null);
      document.querySelectorAll(".sport-tab").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      const dates = getAvailableDates();
      state.date = dates.includes(state.date) ? state.date : (dates[0] || "ALL");
      populateDropdowns();
      renderDateSwitcher();
      updateSportLocationBanner();
      applyFilters();
    });
  });

  document.getElementById("stage-select").addEventListener("change", (event) => {
    state.stage = event.target.value;
    applyFilters();
  });

  document.getElementById("venue-select").addEventListener("change", (event) => {
    state.venue = event.target.value;
    applyFilters();
  });

  document.getElementById("team-search").addEventListener("input", (event) => {
    state.keyword = event.target.value.trim().toLocaleLowerCase();
    applyFilters();
  });

  document.getElementById("detail-close").addEventListener("click", () => setSelectedMatch(null));

  populateDropdowns();
  renderDateSwitcher();
  updateSportLocationBanner();
  applyFilters();
});

function getAvailableDates() {
  const dates = [...new Set(ALL_DATA.filter((item) => item.sport === state.sport).map((item) => item.date))];
  return dates.sort((a, b) => {
    const [am, ad] = a.split("/").map(Number);
    const [bm, bd] = b.split("/").map(Number);
    return am - bm || ad - bd;
  });
}

function renderDateSwitcher() {
  const container = document.getElementById("date-switcher");
  const dates = getAvailableDates();
  container.innerHTML = "";

  dates.forEach((date) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `date-switch-btn${state.date === date ? " active" : ""}`;
    button.textContent = date;
    button.setAttribute("aria-pressed", String(state.date === date));
    button.addEventListener("click", () => {
      if (state.date === date) return;
      state.date = date;
      setSelectedMatch(null);
      renderDateSwitcher();
      applyFilters();
    });
    container.appendChild(button);
  });

  if (!dates.length) container.textContent = "目前沒有可顯示的日期";
}

function populateDropdowns() {
  const sportItems = ALL_DATA.filter((item) => item.sport === state.sport);
  const stages = [...new Set(sportItems.map((item) => item.stage))];
  const venues = [...new Set(sportItems.map((item) => item.venue))];

  const stageSelect = document.getElementById("stage-select");
  stageSelect.innerHTML = '<option value="ALL">全部賽事階段</option>';
  stages.forEach((stage) => {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage;
    stageSelect.appendChild(option);
  });
  stageSelect.value = state.stage;

  const venueSelect = document.getElementById("venue-select");
  venueSelect.innerHTML = '<option value="ALL">全部場地</option>';
  venues.forEach((venue) => {
    const option = document.createElement("option");
    option.value = venue;
    option.textContent = venue;
    venueSelect.appendChild(option);
  });
  venueSelect.value = state.venue;
}

function updateSportLocationBanner() {
  const desc = document.getElementById("timeline-location-desc");
  if (desc) {
    desc.textContent = `比賽地點：${SPORT_LOCATION_SUMMARY[state.sport] || "依各場次公告為準"}。依時間由上而下排列，同一時段的不同場地賽事會並列顯示。`;
  }
}

function applyFilters() {
  allSportMatches = ALL_DATA.filter((item) => item.sport === state.sport && item.date === state.date);

  filteredMatches = allSportMatches.filter((match) => {
    if (state.stage !== "ALL" && match.stage !== state.stage) return false;
    if (state.venue !== "ALL" && match.venue !== state.venue) return false;
    if (state.keyword) {
      const searchable = `${match.teamA} ${match.teamB} ${match.venue} ${match.location} ${match.stage} ${match.time} ${match.date}`.toLocaleLowerCase();
      if (!searchable.includes(state.keyword)) return false;
    }
    return true;
  });

  filteredMatches.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time) || a.venue.localeCompare(b.venue, "zh-Hant"));

  if (state.selectedMatch && !filteredMatches.includes(state.selectedMatch)) setSelectedMatch(null);

  const uniqueVenues = new Set(filteredMatches.map((match) => match.venue));
  document.getElementById("kpi-sport").textContent = state.sport;
  document.getElementById("kpi-count").textContent = filteredMatches.length;
  document.getElementById("kpi-venues").textContent = uniqueVenues.size;
  document.getElementById("list-counter").textContent = `顯示 ${filteredMatches.length} / ${allSportMatches.length} 筆`;

  renderVerticalTimeline();
  renderScheduleList();
}

function renderVerticalTimeline() {
  const container = document.getElementById("vertical-timeline");
  container.innerHTML = "";

  if (!filteredMatches.length) {
    container.innerHTML = '<div class="timeline-empty">這一天沒有符合條件的賽程資料</div>';
    return;
  }

  const grouped = new Map();
  filteredMatches.forEach((match) => {
    if (!grouped.has(match.time)) grouped.set(match.time, []);
    grouped.get(match.time).push(match);
  });

  grouped.forEach((matches, time) => {
    const group = document.createElement("section");
    group.className = "timeline-time-group";

    const timeLabel = document.createElement("div");
    timeLabel.className = "timeline-time-label";
    timeLabel.textContent = time;

    const matchGrid = document.createElement("div");
    matchGrid.className = "timeline-match-grid";

    matches.forEach((match) => {
      const card = document.createElement("button");
      card.type = "button";
      const selected = state.selectedMatch === match;
      card.className = `timeline-match-card ${escapeHtml(match.type || "prelim")}${selected ? " selected" : ""}`;
      card.setAttribute("aria-pressed", String(selected));
      card.innerHTML = `
        <div class="timeline-card-top">
          <span class="timeline-stage-tag">${escapeHtml(match.stage)}</span>
          <span class="timeline-venue-tag">${escapeHtml(match.venue)}</span>
        </div>
        <div class="timeline-match-teams">${escapeHtml(formatFullTitle(match))}</div>
        <div class="timeline-match-location">${escapeHtml(match.location)} · ${Number(match.duration) || 0} 分鐘</div>
      `;
      card.addEventListener("click", () => {
        setSelectedMatch(match);
        renderVerticalTimeline();
        renderScheduleList();
      });
      matchGrid.appendChild(card);
    });

    group.appendChild(timeLabel);
    group.appendChild(matchGrid);
    container.appendChild(group);
  });
}

function renderScheduleList() {
  const container = document.getElementById("schedule-list");
  container.innerHTML = "";

  if (!filteredMatches.length) {
    container.innerHTML = '<div class="empty-schedule">查無符合條件的賽程資料</div>';
    return;
  }

  filteredMatches.forEach((match) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `match-row ${escapeHtml(match.type || "prelim")}${state.selectedMatch === match ? " selected" : ""}`;
    row.setAttribute("aria-pressed", String(state.selectedMatch === match));

    const badges = document.createElement("div");
    badges.className = "match-badges";
    badges.innerHTML = `
      <span class="badge-time">${escapeHtml(match.time)}</span>
      <span class="badge-location">${escapeHtml(match.location)}</span>
      <span class="badge-venue">${escapeHtml(match.venue)}</span>
      <span class="badge-date">${escapeHtml(match.date)}</span>
    `;

    const teams = document.createElement("div");
    teams.className = "match-teams";
    teams.textContent = `${match.stage}｜${formatFullTitle(match)}`;

    row.appendChild(badges);
    row.appendChild(teams);
    row.addEventListener("click", () => {
      setSelectedMatch(match);
      renderVerticalTimeline();
      renderScheduleList();
    });
    container.appendChild(row);
  });
}

function setSelectedMatch(match) {
  state.selectedMatch = state.selectedMatch === match ? null : match;
  const box = document.getElementById("selected-detail");
  if (!state.selectedMatch) {
    box.classList.remove("show");
    document.getElementById("detail-meta").textContent = "";
    document.getElementById("detail-title").textContent = "";
    return;
  }

  const selected = state.selectedMatch;
  document.getElementById("detail-meta").textContent =
    `日期：${selected.date} ｜ 地點：${selected.location} ｜ 球類：${selected.sport} ｜ 階段：${selected.stage} ｜ 時間：${selected.time} ｜ 場地：${selected.venue} ｜ 預計時間：${selected.duration} 分鐘`;
  document.getElementById("detail-title").textContent = formatFullTitle(selected);
  box.classList.add("show");
}
