import { LitElement, html, css } from 'lit';
import { format } from 'timeago.js';

export interface Comment {
  id: string;
  text: string;
  date: string;
  name: string;
  avatar: string;
  emoji: string;
  liked?: boolean;
}

const NAMES = [
  'Ana García', 'Carlos López', 'María Rodríguez', 'José Martínez',
  'Laura Hernández', 'Pedro González', 'Sofía Pérez', 'Juan Sánchez',
  'Valentina Ramírez', 'Diego Torres', 'Isabella Flores', 'Andrés Rivera',
  'Camila Morales', 'Mateo Ortiz', 'Luciana Castillo', 'Santiago Reyes',
  'Gabriela Vargas', 'Emilio Guzmán', 'Daniela Mendoza', 'Benjamín Ruiz',
];

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💯', '⭐', '👏'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let idCounter = 0;
function uniqueId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `cs-${++idCounter}-${Date.now()}`;
  }
}

/**
 * `<universal-comments>` Web Component
 *
 * Self-contained comment section with emoji reactions,
 * loading skeleton, responsive grid, and no framework dependencies.
 *
 * @element universal-comments
 * @attr {number} max-comments - Visible comments before "Ver más" (default: 6)
 * @attr {string} placeholder - Textarea placeholder (default: "Escribe un comentario...")
 * @attr {string} theme - "dark" | "light" (default: "dark")
 * @attr {number} char-limit - Max characters per comment (default: 500)
 *
 * @property {Array} initialComments - Seed comments programmatically
 *
 * @fires comment-added - Dispatched when a comment is added (detail: { comment })
 * @fires comment-deleted - Dispatched when a comment is deleted (detail: { commentId })
 */
export class UniversalComments extends LitElement {
  static properties = {
    maxcomments: { type: Number, attribute: 'max-comments' },
    placeholder: { type: String },
    theme: { type: String },
    charlimit: { type: Number, attribute: 'char-limit' },
    _comments: { state: true },
    _newComment: { state: true },
    _error: { state: true },
    _showAll: { state: true },
    _loading: { state: true },
    _emojiPickerOpen: { state: true },
    _emojiPickerForComment: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 56rem;
      margin: 0 auto;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .container {
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .container.dark {
      background: #0b1422;
      color: #fff;
    }

    .container.light {
      background: #fff;
      color: #1f2937;
      border: 1px solid #e5e7eb;
    }

    h2 {
      font-size: 1.875rem;
      font-weight: 700;
      margin: 0 0 1.5rem;
      text-align: center;
    }

    .input-area {
      margin-bottom: 1.5rem;
      position: relative;
    }

    textarea {
      width: 100%;
      padding: 1rem;
      border-radius: 0.75rem;
      min-height: 100px;
      resize: vertical;
      font-family: inherit;
      font-size: 0.875rem;
      line-height: 1.5;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    textarea:focus {
      outline: none;
      box-shadow: 0 0 0 2px #3b82f6;
    }

    .light textarea {
      background: #fff;
      color: #1f2937;
      border: 1px solid #d1d5db;
    }

    .light textarea:focus {
      border-color: #3b82f6;
    }

    .dark textarea {
      background: #1e293b;
      color: #fff;
      border: 1px solid #334155;
    }

    .dark textarea:focus {
      border-color: #3b82f6;
    }

    .char-count {
      text-align: right;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .dark .char-count {
      color: rgba(255, 255, 255, 0.5);
    }

    .light .char-count {
      color: #6b7280;
    }

    .char-count.over {
      color: #ef4444;
    }

    .error {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .button-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .emoji-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      background: transparent;
      cursor: pointer;
      font-size: 1.25rem;
      transition: background 0.15s;
      border: 1px solid #d1d5db;
    }

    .dark .emoji-btn {
      border-color: #334155;
    }

    .light .emoji-btn {
      border-color: #d1d5db;
    }

    .emoji-btn:hover {
      background: rgba(59, 130, 246, 0.15);
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      font-family: inherit;
      font-size: 0.875rem;
    }

    .submit-btn:hover {
      background: #2563eb;
    }

    .submit-btn:active {
      transform: scale(0.97);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .emoji-picker-wrapper {
      position: absolute;
      bottom: 3.5rem;
      left: 0;
      z-index: 10;
    }

    .emoji-picker-grid {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 0.5rem;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.25rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }

    .input-spotlight {
      position: relative;
    }

    .input-spotlight-overlay {
      pointer-events: none;
      position: absolute;
      inset: 0;
      border-radius: 0.75rem;
      opacity: 0;
      transition: opacity 0.5s;
    }

    .input-spotlight-overlay.visible {
      opacity: 1;
    }

    .light .emoji-picker-grid {
      background: #fff;
      border-color: #e5e7eb;
    }

    .emoji-picker-grid button {
      background: none;
      border: none;
      font-size: 1.5rem;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 0.375rem;
      transition: background 0.15s;
    }

    .emoji-picker-grid button:hover {
      background: rgba(59, 130, 246, 0.2);
    }

    .comment-area {
      position: relative;
    }

    .comment-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.75rem;
      padding-bottom: 4rem;
      transition: max-height 0.3s ease;
    }

    @media (min-width: 640px) {
      .comment-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 768px) {
      .comment-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .comment-grid.truncated {
      max-height: 400px;
      overflow: hidden;
    }

    .comment-card {
      border: 1px solid #111c2d;
      border-radius: 1rem;
      padding: 1.25rem;
      animation: fadeInUp 0.3s ease;
      break-inside: avoid;
      margin-bottom: 0;
      transition: opacity 0.3s ease, transform 0.3s ease, height 0.3s ease, padding 0.3s ease, margin 0.3s ease;
      overflow: hidden;
    }

    .comment-card.deleting {
      opacity: 0;
      transform: translateX(100px);
      padding: 0 1.25rem;
      margin: 0;
      border-width: 0;
    }

    .dark .comment-card {
      background: #0b1422;
    }

    .light .comment-card {
      border-color: #e5e7eb;
      background: #f9fafb;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .avatar {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      object-fit: cover;
    }

    .name {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .time {
      margin: 0;
      font-size: 0.875rem;
    }

    .dark .time {
      color: rgba(255, 255, 255, 0.6);
    }

    .light .time {
      color: #6b7280;
    }

    .comment-text {
      margin-top: 0.625rem;
    }

    .dark .comment-text {
      color: rgba(255, 255, 255, 0.7);
    }

    .light .comment-text {
      color: #4b5563;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      position: relative;
    }

    .reaction-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      transition: background 0.15s, transform 0.1s;
      line-height: 1;
    }

    .reaction-btn:hover {
      background: rgba(59, 130, 246, 0.15);
    }

    .reaction-btn:active {
      transform: scale(0.9);
    }

    .delete-btn {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      opacity: 0.4;
      transition: opacity 0.15s;
      line-height: 1;
    }

    .delete-btn:hover {
      opacity: 1;
    }

    .gradient-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6rem;
      pointer-events: none;
    }

    .dark .gradient-overlay {
      background: linear-gradient(to top, #0b1422, transparent);
    }

    .light .gradient-overlay {
      background: linear-gradient(to top, #fff, transparent);
    }

    .show-more-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 0.625rem 1rem;
      border-radius: 0.625rem;
      font-weight: 700;
      border: 1px solid #3b82f6;
      background: #3b82f6;
      color: #fff;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.2s;
      font-family: inherit;
      font-size: 0.875rem;
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
    }

    .show-more-btn:hover {
      transform: translateX(-50%) scale(1.05);
    }

    .show-more-btn:active {
      transform: translateX(-50%) scale(0.97);
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.75rem;
      padding-bottom: 4rem;
    }

    @media (min-width: 640px) {
      .skeleton-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 768px) {
      .skeleton-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .skeleton-card {
      border: 1px solid #111c2d;
      border-radius: 1rem;
      padding: 1.25rem;
    }

    .skeleton-avatar {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: #4b5563;
      margin-bottom: 1rem;
    }

    .skeleton-line {
      height: 1rem;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .skeleton-line.short {
      width: 75%;
    }

    .skeleton-line.full {
      width: 100%;
    }

    .skeleton-line.medium {
      width: 83%;
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .dark .empty-state {
      color: rgba(255, 255, 255, 0.5);
    }

    .light .empty-state {
      color: #9ca3af;
    }

    .empty-state p {
      font-size: 1.125rem;
      margin: 0;
    }

    .reaction-wrapper {
      position: relative;
    }

    .reaction-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: 0.5rem;
      z-index: 10;
    }
  `;

  declare maxcomments: number;
  declare placeholder: string;
  declare theme: 'dark' | 'light';
  declare charlimit: number;
  declare _comments: Comment[];
  declare _newComment: string;
  declare _error: string;
  declare _showAll: boolean;
  declare _loading: boolean;
  declare _emojiPickerOpen: boolean;
  declare _emojiPickerForComment: string | null;
  declare _lastSubmit: number;
  declare _deletingIds: Set<string>;
  declare _boundOnDocumentClick: (e: MouseEvent) => void;
  declare _spotlightVisible: boolean;
  declare _spotlightStyle: string;

  constructor() {
    super();
    this.maxcomments = 6;
    this.placeholder = 'Escribe un comentario...';
    this.theme = 'dark';
    this.charlimit = 500;
    this._comments = [];
    this._newComment = '';
    this._error = '';
    this._showAll = false;
    this._loading = true;
    this._emojiPickerOpen = false;
    this._emojiPickerForComment = null;
    this._lastSubmit = 0;
    this._deletingIds = new Set();
    this._spotlightVisible = false;
    this._spotlightStyle = '';
    this._boundOnDocumentClick = this._onDocumentClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._boundOnDocumentClick);
    setTimeout(() => {
      this._loading = false;
      this.requestUpdate();
    }, 2000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._boundOnDocumentClick);
  }

  set initialComments(comments: Comment[]) {
    this._comments = comments.map((c) => ({
      id: c.id || uniqueId(),
      text: c.text,
      date: c.date || new Date().toISOString(),
      name: c.name || 'Anónimo',
      avatar:
        c.avatar ||
        `https://i.pravatar.cc/80?u=${c.id || uniqueId()}`,
      emoji: c.emoji || '👍',
      liked: c.liked,
    }));
    this._loading = false;
    this.requestUpdate();
  }

  get initialComments(): Comment[] {
    return this._comments;
  }

  _emit(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  _onInput(e: Event) {
    this._newComment = (e.target as HTMLTextAreaElement).value;
    if (this._error && this._newComment.trim().length >= 3) {
      this._error = '';
    }
  }

  _onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this._addComment();
    }
  }

  _addComment() {
    const now = Date.now();
    if (now - this._lastSubmit < 500) {
      return;
    }

    const text = this._newComment.trim();
    if (text.length < 3) {
      this._error = 'El comentario debe tener al menos 3 caracteres';
      this.requestUpdate();
      return;
    }

    if (text.length > this.charlimit) {
      this._error = `El comentario no puede exceder ${this.charlimit} caracteres`;
      this.requestUpdate();
      return;
    }

    this._lastSubmit = now;
    const comment = {
      id: uniqueId(),
      text,
      date: new Date().toISOString(),
      likes: 0,
      liked: false,
      emoji: '👍',
      avatar: `https://i.pravatar.cc/80?u=${uniqueId()}`,
      name: randomItem(NAMES),
    };
    this._comments = [comment, ...this._comments];
    this._newComment = '';
    this._error = '';
    this._emojiPickerOpen = false;
    this._emit('comment-added', { comment });
    this.requestUpdate();
  }

  _toggleEmojiPicker(e: MouseEvent) {
    e.stopPropagation();
    this._emojiPickerOpen = !this._emojiPickerOpen;
    this._emojiPickerForComment = null;
    this.requestUpdate();
  }

  _handleTextEmojiSelect(e: Event, emoji: string) {
    e.stopPropagation();
    this._newComment += emoji;
    this._emojiPickerOpen = false;
    this.requestUpdate();
  }

  _toggleCommentEmoji(e: Event, commentId: string) {
    e.stopPropagation();
    this._emojiPickerForComment =
      this._emojiPickerForComment === commentId ? null : commentId;
    this._emojiPickerOpen = false;
    this.requestUpdate();
  }

  _setCommentEmoji(e: Event, commentId: string, emoji: string) {
    e.stopPropagation();
    this._comments = this._comments.map((c) =>
      c.id === commentId ? { ...c, emoji, liked: true } : c,
    );
    this._emojiPickerForComment = null;
    this.requestUpdate();
  }

  _toggleShowAll() {
    this._showAll = !this._showAll;
  }

  _deleteComment(e: Event, commentId: string) {
    e.stopPropagation();
    this._deletingIds.add(commentId);
    this.requestUpdate();
    setTimeout(() => {
      this._comments = this._comments.filter((c) => c.id !== commentId);
      this._deletingIds.delete(commentId);
      if (this._emojiPickerForComment === commentId) {
        this._emojiPickerForComment = null;
      }
      this._emit('comment-deleted', { commentId });
      this.requestUpdate();
    }, 300);
  }

  _onDocumentClick(e: MouseEvent) {
    const path = e.composedPath();
    if (path.includes(this)) return;
    if (this._emojiPickerOpen || this._emojiPickerForComment !== null) {
      this._emojiPickerOpen = false;
      this._emojiPickerForComment = null;
      this.requestUpdate();
    }
  }

  _onInputSpotlightMove(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this._spotlightStyle = `background: radial-gradient(300px circle at ${x}px ${y}px, rgba(120,119,198,0.15), transparent 40%);`;
    this._spotlightVisible = true;
    this.requestUpdate();
  }

  _onInputSpotlightLeave() {
    this._spotlightVisible = false;
    this._spotlightStyle = '';
    this.requestUpdate();
  }

  _renderSkeleton() {
    return html`
      <div class="skeleton-grid">
        ${[1, 2, 3, 4, 5, 6].map(
          () => html`
            <div class="skeleton-card">
              <div class="skeleton-avatar animate-pulse"></div>
              <div class="skeleton-line short animate-pulse"></div>
              <div class="skeleton-line full animate-pulse"></div>
              <div class="skeleton-line medium animate-pulse"></div>
            </div>
          `,
        )}
      </div>
    `;
  }

  _renderEmpty() {
    return html`
      <div class="empty-state">
        <p>No hay comentarios aún</p>
      </div>
    `;
  }

  _renderComments() {
    const visible = this._showAll
      ? this._comments
      : this._comments.slice(0, this.maxcomments);
    const truncated =
      !this._showAll && this._comments.length > this.maxcomments;

    return html`
      <div class="comment-area">
        <div class="comment-grid${truncated ? ' truncated' : ''}">
          ${visible.map(
            (c) => html`
              <div class="comment-card${this._deletingIds.has(c.id) ? ' deleting' : ''}">
                <div class="card-header">
                  <img
                    class="avatar"
                    src="${c.avatar}"
                    alt="Avatar de ${c.name}"
                    loading="lazy"
                    width="64"
                    height="64"
                  />
                  <div>
                    <p class="name">${c.name}</p>
                    <p class="time">${format(c.date)}</p>
                  </div>
                </div>
                <p class="comment-text">${c.text}</p>
                <div class="card-footer">
                  <div class="reaction-wrapper">
                    <button
                      class="reaction-btn"
                      @click="${(e: Event) => this._toggleCommentEmoji(e, c.id)}"
                      aria-label="Reaccionar al comentario"
                    >
                      ${c.emoji}
                    </button>
                    ${this._emojiPickerForComment === c.id
                      ? html`
                          <div class="reaction-picker">
                            <div class="emoji-picker-grid">
                              ${EMOJIS.map(
                                (e) => html`
                                  <button
                                    @click="${(ev: Event) =>
                                      this._setCommentEmoji(ev, c.id, e)}"
                                    aria-label="${e}"
                                  >
                                    ${e}
                                  </button>
                                `,
                              )}
                            </div>
                          </div>
                        `
                      : ''}
                  </div>
                  <button
                    class="delete-btn"
                    @click="${(e: Event) => this._deleteComment(e, c.id)}"
                    aria-label="Eliminar comentario de ${c.name}"
                  >
                    🗑
                  </button>
                </div>
              </div>
            `,
          )}
        </div>
        ${truncated ? html`<div class="gradient-overlay"></div>` : ''}
      </div>
      ${this._comments.length > this.maxcomments
        ? html`
            <button class="show-more-btn" @click="${this._toggleShowAll}">
              ${this._showAll ? 'Ver menos' : 'Ver más'}
            </button>
          `
        : ''}
    `;
  }

  render() {
    return html`
      <div class="container ${this.theme}">
        <h2>Comentarios</h2>

        <div class="input-area">
          <div class="input-spotlight"
            @mousemove="${this._onInputSpotlightMove}"
            @mouseleave="${this._onInputSpotlightLeave}">
            <textarea
              .value="${this._newComment}"
              @input="${this._onInput}"
              @keydown="${this._onKeyDown}"
              placeholder="${this.placeholder}"
              maxlength="${this.charlimit}"
              aria-label="Escribe un comentario"
            ></textarea>
            <div class="input-spotlight-overlay${this._spotlightVisible ? ' visible' : ''}" style="${this._spotlightStyle}"></div>
          </div>
          <div class="char-count${this._newComment.length > this.charlimit * 0.9
            ? ' over'
            : ''}">
            ${this._newComment.length}/${this.charlimit}
          </div>
          ${this._error ? html`<p class="error">${this._error}</p>` : ''}
          <div class="button-row">
            <button
              class="emoji-btn"
              @click="${this._toggleEmojiPicker}"
              title="Añadir emoji"
              aria-label="Abrir selector de emojis"
            >
              😊
            </button>
            <button
              class="submit-btn"
              @click="${this._addComment}"
              ?disabled="${this._loading}"
            >
              Publicar comentario
            </button>
          </div>
          ${this._emojiPickerOpen
            ? html`
                <div class="emoji-picker-wrapper">
                  <div class="emoji-picker-grid">
                    ${EMOJIS.map(
                      (e) => html`
                        <button
                          @click="${(ev: Event) => this._handleTextEmojiSelect(ev, e)}"
                          aria-label="${e}"
                        >
                          ${e}
                        </button>
                      `,
                    )}
                  </div>
                </div>
              `
            : ''}
        </div>

        ${this._loading
          ? this._renderSkeleton()
          : this._comments.length === 0
            ? this._renderEmpty()
            : this._renderComments()}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  customElements.define('universal-comments', UniversalComments);
}

declare global {
  interface HTMLElementTagNameMap {
    'universal-comments': UniversalComments;
  }
}
