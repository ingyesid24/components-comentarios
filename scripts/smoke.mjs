import { Window } from 'happy-dom';

const w = new Window();
globalThis.window = w;
globalThis.document = w.document;
globalThis.HTMLElement = w.HTMLElement;
globalThis.customElements = w.customElements;
globalThis.CustomEvent = w.CustomEvent;
globalThis.CSSStyleSheet = w.CSSStyleSheet;

const m = await import('comment-section');
if (typeof m.CommentSection !== 'function') throw new Error('CommentSection export missing');

const el = w.document.createElement('comment-section');
w.document.body.appendChild(el);
await new Promise((r) => setTimeout(r, 2200));
await el.updateComplete;

let added = null;
el.addEventListener('comment-added', (e) => {
  added = e.detail.comment;
});

const textarea = el.shadowRoot.querySelector('textarea');
textarea.value = 'Smoke test';
textarea.dispatchEvent(new w.Event('input'));
el.shadowRoot.querySelector('.submit-btn').click();
await new Promise((r) => setTimeout(r, 100));
await el.updateComplete;

if (!added || added.text !== 'Smoke test') throw new Error('comment-added event failed');
console.log('OK: import + render + comment-added event');