import { html, render } from 'lit';
import { expect } from '@esm-bundle/chai';
import './comment-section.js';

async function createFixture() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<comment-section></comment-section>`, container);
  const el = container.firstElementChild as HTMLElement;
  await (el as any).updateComplete;
  return { el, container };
}

async function waitForLoad(el: HTMLElement) {
  await new Promise((r) => setTimeout(r, 2100));
  await (el as any).updateComplete;
}

describe('comment-section', () => {
  afterEach(() => {
    document.body.querySelectorAll('div').forEach((d) => d.remove());
  });

  it('should render the title', async () => {
    const { el } = await createFixture();
    await waitForLoad(el);
    const title = el.shadowRoot?.querySelector('h2');
    expect(title).to.exist;
    expect(title?.textContent).to.equal('Comentarios');
  });

  it('should show loading skeleton initially', async () => {
    const { el } = await createFixture();
    const skeleton = el.shadowRoot?.querySelector('.skeleton-grid');
    expect(skeleton).to.exist;
  });

  it('should show empty state after loading', async () => {
    const { el } = await createFixture();
    await waitForLoad(el);
    const empty = el.shadowRoot?.querySelector('.empty-state');
    expect(empty).to.exist;
    expect(empty?.textContent).to.include('No hay comentarios');
  });

  it('should add a comment on submit', async () => {
    const { el } = await createFixture();
    await waitForLoad(el);

    const textarea = el.shadowRoot?.querySelector('textarea');
    const button = el.shadowRoot?.querySelector('.submit-btn') as HTMLButtonElement;

    if (textarea && button) {
      (textarea as HTMLTextAreaElement).value = 'Hola mundo';
      textarea.dispatchEvent(new Event('input'));
      button.click();

      await new Promise((r) => setTimeout(r, 100));
      await (el as any).updateComplete;

      const cards = el.shadowRoot?.querySelectorAll('.comment-card');
      expect(cards?.length).to.be.at.least(1);
    }
  });

  it('should accept initial comments via property', async () => {
    const { el } = await createFixture();
    await waitForLoad(el);

    const initial = [
      { id: '1', text: 'Test comment', name: 'Test User', avatar: '', date: new Date().toISOString(), emoji: '👍' },
    ];
    (el as any).initialComments = initial;
    await (el as any).updateComplete;

    const cards = el.shadowRoot?.querySelectorAll('.comment-card');
    expect(cards?.length).to.equal(1);
    expect(cards?.[0]?.textContent).to.include('Test comment');
  });
});
