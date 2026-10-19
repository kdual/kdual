/* FAQ rich text renderer. Plain text remains authoritative; spreadsheet markup is never HTML. */
(function (root) {
  'use strict';
  const color = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
  function render(element, text, format) {
    element.textContent = String(text || '');
    if (!format || format.text !== text || !Array.isArray(format.runs) || format.runs.length > 2000) return;
    const runs = format.runs;
    let cursor = 0;
    for (const run of runs) {
      if (!run || !Number.isInteger(run.start) || !Number.isInteger(run.end) || run.start !== cursor || run.end <= run.start || run.end > text.length) return;
      cursor = run.end;
    }
    if (cursor !== text.length) return;
    const fragment = element.ownerDocument.createDocumentFragment();
    for (const run of runs) {
      const span = element.ownerDocument.createElement('span');
      span.textContent = text.slice(run.start, run.end);
      if (typeof run.bold === 'boolean') span.style.fontWeight = run.bold ? '700' : '400';
      if (color(run.color)) span.style.color = run.color;
      fragment.append(span);
    }
    element.replaceChildren(fragment);
    if (color(format.background) && format.background.toLowerCase() !== '#ffffff') {
      element.style.backgroundColor = format.background;
    }
  }
  root.FaqRichText = {render};
  if (typeof module !== 'undefined' && module.exports) module.exports = {render};
})(typeof window !== 'undefined' ? window : globalThis);
