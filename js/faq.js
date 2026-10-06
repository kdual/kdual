(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const mainTopics = ['전체', '간담회', '커뮤니티', '제도개선', 'FAQ'];
  const nestedTopics = new Set(['간담회', '커뮤니티', '제도개선']);
  const config = window.FAQ_CONFIG || {};
  let entries = [], category = '전체', topic = '전체', expanded = '', query = '', busy = false;
  const node = (tag, cls, value) => {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (value !== undefined) element.textContent = value;
    return element;
  };
  function safeLink(value) {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  }
  function normalizeEntry(entry) {
    // The existing Apps Script publishes column B. The sheet joins the new
    // main/subtopic inputs there, without changing its original A:H schema.
    const raw = String(entry.category || '').trim();
    const separator = raw.indexOf(' / ');
    const main = separator < 0 ? raw : raw.slice(0, separator).trim();
    const sub = String(entry.topic ?? entry.subtopic ?? (separator < 0 ? '' : raw.slice(separator + 3))).trim();
    return {
      ...entry,
      category: mainTopics.slice(1).includes(main) ? main : 'FAQ',
      topic: nestedTopics.has(main) ? sub : '',
      legacyCategory: mainTopics.slice(1).includes(main) ? '' : main,
      pinned: entry.pinned === true,
    };
  }
  function topicsFor(name) {
    return ['전체', ...new Set(entries.filter(entry => entry.category === name && entry.topic && entry.topic !== '전체').map(entry => entry.topic))];
  }
  function restoreFocus(categoryName, topicName) {
    const buttons = [...$('#categories').querySelectorAll('button')];
    const match = buttons.find(button => button.dataset.category === categoryName && button.dataset.topic === topicName);
    if (match) match.focus({preventScroll: true});
  }
  function renderCategories() {
    if (!busy && topic !== '전체' && !topicsFor(category).includes(topic)) topic = '전체';
    $('#categories').replaceChildren(...mainTopics.map((name, index) => {
      const group = node('div', 'category-group');
      const button = node('button', 'category-parent');
      button.type = 'button'; button.dataset.category = name;
      button.append(node('span', 'category-name', name));
      button.append(node('span', 'total', String(name === '전체' ? entries.length : entries.filter(entry => entry.category === name).length)));
      button.setAttribute('aria-pressed', String(name === category));
      if (nestedTopics.has(name)) {
        const caret = node('span', 'category-caret', '⌄'); caret.setAttribute('aria-hidden', 'true'); button.append(caret);
        button.setAttribute('aria-expanded', String(expanded === name));
        button.setAttribute('aria-controls', `faq-topics-${index}`);
      }
      button.onclick = () => {
        expanded = nestedTopics.has(name) && expanded !== name ? name : '';
        category = name; topic = '전체'; renderCategories(); renderList(); restoreFocus(name, undefined);
      };
      group.append(button);
      if (nestedTopics.has(name)) {
        const children = node('div', 'category-topics');
        children.id = `faq-topics-${index}`; children.hidden = expanded !== name;
        children.setAttribute('aria-label', `${name} 하위 주제`);
        topicsFor(name).forEach(subtopic => {
          const child = node('button', 'category-topic'); child.type = 'button';
          child.dataset.category = name; child.dataset.topic = subtopic;
          child.setAttribute('aria-pressed', String(category === name && topic === subtopic));
          child.append(node('span', 'category-name', subtopic), node('span', 'total', String(entries.filter(entry => entry.category === name && (subtopic === '전체' || entry.topic === subtopic)).length)));
          child.onclick = () => { category = name; topic = subtopic; expanded = name; renderCategories(); renderList(); restoreFocus(name, subtopic); };
          children.append(child);
        });
        group.append(children);
      }
      return group;
    }));
  }
  function renderList() {
    const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const visible = entries.filter(entry => (category === '전체' || entry.category === category) && (topic === '전체' || entry.topic === topic) && words.every(word => `${entry.question} ${entry.answer} ${entry.category} ${entry.topic} ${entry.legacyCategory}`.toLocaleLowerCase().includes(word)));
    const label = category === '전체' ? '전체 질문' : topic === '전체' ? category : `${category} · ${topic}`;
    $('#list-title').replaceChildren(document.createTextNode(label), node('span', '', String(visible.length)));
    $('#faq-list').replaceChildren(...visible.map(entry => {
      const detail = node('details'), summary = node('summary'), wrap = node('div'), meta = node('div', 'meta');
      meta.append(node('span', '', [entry.category, entry.topic || entry.legacyCategory].filter(Boolean).join(' · ')));
      if (entry.pinned) meta.append(node('span', 'pin', '중요'));
      wrap.append(meta, node('span', 'question-title', entry.question));
      const plus = node('span', 'plus', '+'); plus.setAttribute('aria-hidden', 'true');
      summary.append(node('span', 'q', 'Q'), wrap, plus);
      const answer = node('div', 'answer'); answer.append(node('p', 'answer-text', entry.answer));
      const link = safeLink(entry.link);
      if (link) { const anchor = node('a', 'answer-link', '관련 자료 보기 ↗'); anchor.href = link; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; answer.append(anchor); }
      if (entry.updated) answer.append(node('div', 'answer-meta', `수정일 ${entry.updated}`));
      detail.append(summary, answer); return detail;
    }));
    $('#empty').hidden = visible.length > 0 || busy;
  }
  async function loadFaqData() {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try {
      const url = new URL('data/faq.json', window.location.href); url.searchParams.set('_', Date.now());
      const response = await fetch(url, {cache: 'no-store', signal: controller.signal});
      if (!response.ok) throw new Error(`FAQ 데이터 응답 오류 (${response.status})`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function load() {
    if (busy) return;
    busy = true; $('#refresh').disabled = true; $('#status').className = ''; $('#status').textContent = '질문을 불러오는 중입니다…';
    entries = []; renderCategories(); renderList();
    try {
      let result;
      if (config.demo === true && !config.apiUrl) {
        result = window.FAQ_DEMO; $('#status').textContent = '미리보기 · 화면 확인용 예시입니다. 공식 FAQ가 아닙니다.';
      } else {
        const response = await loadFaqData();
        if (!response || response.ok !== true || !Array.isArray(response.items)) throw new Error('데이터 형식 오류');
        result = response.items;
        const synced = response.syncedAt ? new Date(response.syncedAt) : null;
        $('#status').textContent = synced && !Number.isNaN(synced.getTime())
          ? `최근 동기화 ${synced.toLocaleString('ko-KR', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}`
          : `최근 확인 ${new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}`;
      }
      entries = result.filter(entry => entry && typeof entry.question === 'string' && entry.question.trim() && typeof entry.answer === 'string' && entry.answer.trim()).map(normalizeEntry);
      entries.sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.updated || '').localeCompare(String(a.updated || '')));
    } catch (error) { $('#status').className = 'error'; $('#status').textContent = '질문을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.'; }
    finally { busy = false; $('#refresh').disabled = false; renderCategories(); renderList(); if ($('#status').className === 'error') $('#empty').hidden = true; }
  }
  $('#search-form').onsubmit = event => { event.preventDefault(); query = $('#search').value.trim(); renderList(); };
  $('#search').oninput = () => { query = $('#search').value.trim(); renderList(); };
  $('#reset').onclick = () => { query = ''; category = '전체'; topic = '전체'; expanded = ''; $('#search').value = ''; renderCategories(); renderList(); $('#search').focus(); };
  $('#refresh').onclick = load;
  load();
})();
