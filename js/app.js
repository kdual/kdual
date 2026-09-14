const state = {
  allData: [],
  filteredData: []
};

const elements = {
  keywordInput: document.getElementById("keywordInput"),
  yearFilter: document.getElementById("yearFilter"),
  businessFilter: document.getElementById("businessFilter"),
  typeFilter: document.getElementById("typeFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter"),
  sortFilter: document.getElementById("sortFilter"),
  resetButton: document.getElementById("resetButton"),

  totalCount: document.getElementById("totalCount"),
  completedCount: document.getElementById("completedCount"),
  progressCount: document.getElementById("progressCount"),
  completionRate: document.getElementById("completionRate"),

  vocContainer: document.getElementById("vocContainer"),
  resultSummary: document.getElementById("resultSummary"),
  emptyState: document.getElementById("emptyState")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const response = await fetch("data/voc.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`데이터를 불러오지 못했습니다. HTTP ${response.status}`);
    }

    const data = await response.json();

    state.allData = normalizeData(data);
    populateFilters(state.allData);
    updateDashboard(state.allData);
    bindEvents();
    applyFilters();
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

function normalizeData(data) {
  return Array.isArray(data)
    ? data.map((item) => ({
        id: item.id ?? "",
        date: item.date ?? "",
        business: item.business ?? "",
        type: item.type ?? "",
        category: item.category ?? "",
        question: item.question ?? "",
        answer: item.answer ?? "",
        status: item.status ?? "",
        reference: item.reference ?? ""
      }))
    : [];
}

function bindEvents() {
  [
    elements.keywordInput,
    elements.yearFilter,
    elements.businessFilter,
    elements.typeFilter,
    elements.categoryFilter,
    elements.statusFilter,
    elements.sortFilter
  ].forEach((el) => {
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", applyFilters);
  });

  elements.resetButton.addEventListener("click", resetFilters);
}

function populateFilters(data) {
  const years = uniqueValues(
    data
      .map((item) => item.date?.slice(0, 4))
      .filter(Boolean)
  ).sort((a, b) => Number(b) - Number(a));

  fillSelect(elements.yearFilter, years);
  fillSelect(elements.businessFilter, uniqueValues(data.map((d) => d.business)).sort(localeSort));
  fillSelect(elements.typeFilter, uniqueValues(data.map((d) => d.type)).sort(localeSort));
  fillSelect(elements.categoryFilter, uniqueValues(data.map((d) => d.category)).sort(localeSort));
  fillSelect(elements.statusFilter, uniqueValues(data.map((d) => d.status)).sort(localeSort));
}

function fillSelect(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function applyFilters() {
  const keyword = elements.keywordInput.value.trim().toLowerCase();
  const year = elements.yearFilter.value;
  const business = elements.businessFilter.value;
  const type = elements.typeFilter.value;
  const category = elements.categoryFilter.value;
  const status = elements.statusFilter.value;
  const sort = elements.sortFilter.value;

  let result = state.allData.filter((item) => {
    const searchableText = [
      item.id,
      item.date,
      item.business,
      item.type,
      item.category,
      item.question,
      item.answer,
      item.status,
      item.reference
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword = !keyword || searchableText.includes(keyword);
    const matchesYear = !year || item.date.startsWith(year);
    const matchesBusiness = !business || item.business === business;
    const matchesType = !type || item.type === type;
    const matchesCategory = !category || item.category === category;
    const matchesStatus = !status || item.status === status;

    return (
      matchesKeyword &&
      matchesYear &&
      matchesBusiness &&
      matchesType &&
      matchesCategory &&
      matchesStatus
    );
  });

  result.sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return sort === "oldest" ? dateA - dateB : dateB - dateA;
  });

  state.filteredData = result;
  renderList(result);
}

function renderList(data) {
  elements.vocContainer.innerHTML = "";
  elements.resultSummary.textContent = `총 ${data.length}건`;
  elements.emptyState.hidden = data.length !== 0;

  data.forEach((item) => {
    elements.vocContainer.appendChild(createVocItem(item));
  });
}

function createVocItem(item) {
  const article = document.createElement("article");
  article.className = "voc-item";

  const statusClass = getStatusClass(item.status);

  article.innerHTML = `
    <button class="voc-question" type="button" aria-expanded="false">
      <div class="voc-meta">
        <span class="voc-id">${escapeHtml(item.id)}</span>
        <span class="voc-date">${escapeHtml(formatDate(item.date))}</span>
      </div>

      <div class="voc-main">
        <div class="tag-row">
          <span class="tag tag-business">${escapeHtml(item.business)}</span>
          <span class="tag tag-type">${escapeHtml(item.type)}</span>
          <span class="tag tag-category">${escapeHtml(item.category)}</span>
        </div>
        <p class="voc-title">${escapeHtml(item.question)}</p>
      </div>

      <div class="voc-side">
        <span class="status ${statusClass}">${escapeHtml(item.status)}</span>
        <span class="chevron" aria-hidden="true">⌄</span>
      </div>
    </button>

    <div class="voc-answer">
      <div class="answer-box">
        <h4>답변</h4>
        <p>${escapeHtml(item.answer)}</p>
        ${
          item.reference
            ? `<div class="reference"><strong>근거/참고:</strong> ${escapeHtml(item.reference)}</div>`
            : ""
        }
      </div>
    </div>
  `;

  const button = article.querySelector(".voc-question");
  button.addEventListener("click", () => {
    const isOpen = article.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  return article;
}

function updateDashboard(data) {
  const total = data.length;
  const completed = data.filter((item) => item.status === "완료").length;
  const progress = total - completed;
  const rate = total > 0 ? (completed / total) * 100 : 0;

  elements.totalCount.textContent = `${total}건`;
  elements.completedCount.textContent = `${completed}건`;
  elements.progressCount.textContent = `${progress}건`;
  elements.completionRate.textContent = `${rate.toFixed(1)}%`;
}

function resetFilters() {
  elements.keywordInput.value = "";
  elements.yearFilter.value = "";
  elements.businessFilter.value = "";
  elements.typeFilter.value = "";
  elements.categoryFilter.value = "";
  elements.statusFilter.value = "";
  elements.sortFilter.value = "latest";

  applyFilters();
}

function getStatusClass(status) {
  if (status === "완료") return "status-complete";
  if (status === "진행중") return "status-progress";
  return "status-review";
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function localeSort(a, b) {
  return a.localeCompare(b, "ko");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showLoadError() {
  elements.vocContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">!</div>
      <h4>VOC 데이터를 불러오지 못했습니다.</h4>
      <p>
        GitHub Pages 또는 로컬 웹서버 환경에서 실행했는지,
        그리고 data/voc.json 파일 경로가 올바른지 확인해주세요.
      </p>
    </div>
  `;
  elements.resultSummary.textContent = "데이터 로드 오류";
}
