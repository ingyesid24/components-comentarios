import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";

const NAMES = ["Ana", "Carlos", "María", "José", "Laura", "Pedro", "Sofía", "Luis", "Valentina", "Andrés"];
const randomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];
const MAX_CHARS = 500;

const STORAGE_PREFIX = "comments_section_";

const loadFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    /* storage full or unavailable */
  }
};

const CommentSection = ({ storageKey = "default", api }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickers, setEmojiPickers] = useState({});
  const lastPostTime = useRef(0);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      Object.keys(emojiPickers).forEach((id) => {
        const pickerEl = document.getElementById(`emoji-picker-${id}`);
        const buttonEl = document.getElementById(`emoji-btn-${id}`);
        if (
          emojiPickers[id] &&
          pickerEl &&
          !pickerEl.contains(e.target) &&
          buttonEl &&
          !buttonEl.contains(e.target)
        ) {
          setEmojiPickers((prev) => ({ ...prev, [id]: false }));
        }
      });
    };
    if (Object.values(emojiPickers).some(Boolean)) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [emojiPickers]);

  const persistComments = useCallback((updatedComments) => {
    if (!api) {
      saveToStorage(storageKey, updatedComments);
    }
  }, [api, storageKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (api?.fetchComments) {
        try {
          const data = await api.fetchComments();
          if (!cancelled) {
            setComments(Array.isArray(data) ? data : []);
          }
        } catch {
          if (!cancelled) setComments([]);
        }
      } else {
        const stored = loadFromStorage(storageKey);
        if (!cancelled) setComments(Array.isArray(stored) ? stored : []);
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [api, storageKey]);

  useEffect(() => {
    if (!loading && !api) {
      saveToStorage(storageKey, comments);
    }
  }, [comments, loading, api, storageKey]);

  const addComment = async () => {
    const trimmed = newComment.trim();
    if (trimmed.length < 3) {
      setError("El comentario debe tener al menos 3 caracteres");
      return;
    }

    if (trimmed.length > MAX_CHARS) {
      setError(`El comentario no puede exceder ${MAX_CHARS} caracteres`);
      return;
    }

    const now = Date.now();
    if (now - lastPostTime.current < 1000) {
      setError("Demasiado rápido. Espera un segundo.");
      return;
    }
    lastPostTime.current = now;

    const comment = {
      id: crypto.randomUUID(),
      text: trimmed,
      date: new Date().toISOString(),
      likes: 0,
      liked: false,
      emoji: "\u{1F44D}",
      avatar: `https://i.pravatar.cc/80?u=${crypto.randomUUID()}`,
      name: randomName()
    };

    if (api?.addComment) {
      try {
        const saved = await api.addComment(comment);
        setComments((prev) => [saved || comment, ...prev]);
      } catch {
        setError("Error al publicar comentario");
        return;
      }
    } else {
      setComments((prev) => [comment, ...prev]);
    }

    setNewComment("");
    setError("");
  };

  const deleteComment = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleLike = (commentId) => {
    setEmojiPickers((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleEmojiSelect = (emojiObject, commentId) => {
    setComments((prev) => prev.map((comment) =>
      comment.id === commentId
        ? { ...comment, emoji: emojiObject.emoji, liked: true }
        : comment
    ));
    setEmojiPickers((prev) => ({ ...prev, [commentId]: false }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewComment((prev) => prev + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const charsLeft = MAX_CHARS - newComment.length;

  return (
    <section className="max-w-4xl mx-auto p-6 bg-[#0B1422] rounded-2xl shadow-lg text-white" aria-label="Secci\u00f3n de comentarios">
      <h2 className="text-3xl font-bold mb-6 text-center">Comentarios</h2>

      <div className="mb-6 relative">
        <textarea
          ref={textareaRef}
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setNewComment(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_CHARS + 50}
          aria-label="Nuevo comentario"
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[100px] resize-y text-black"
        />

        <button
          type="button"
          ref={emojiButtonRef}
          onClick={toggleEmojiPicker}
          className="absolute bottom-16 right-4 text-2xl hover:scale-110 transition-transform"
          aria-label="Abrir selector de emojis"
          aria-expanded={showEmojiPicker}
        >
          {"\u{1F600}"}
        </button>

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-28 right-4 bg-white p-2 rounded-lg shadow-lg z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div>
            {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
          </div>
          <span className={`text-sm ${charsLeft < 50 ? "text-red-400" : "text-white/40"}`} aria-live="polite">
            {charsLeft}/{MAX_CHARS}
          </span>
        </div>

        <button
          onClick={addComment}
          className="mt-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition duration-200 ease-in-out w-full md:w-auto"
          aria-label="Publicar comentario"
        >
          Publicar comentario
        </button>
      </div>

      <div className="relative overflow-hidden">
        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 pb-16" aria-label="Cargando comentarios">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="border border-[#111C2D] bg-[#0B1422] rounded-2xl p-5 animate-pulse" aria-hidden="true">
                  <div className="w-16 h-16 bg-gray-600 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-white/40 py-16" role="status">No hay comentarios a\u00fan</p>
          ) : (
            <>
              <div className="relative">
                <ul className={`mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 pb-16 transition-all ${!showAll ? "max-h-[400px] overflow-hidden" : ""}`} role="list">
                  <AnimatePresence>
                    {(showAll ? comments : comments.slice(0, 6)).map((comment) => (
                      <motion.li
                        key={comment.id}
                        role="listitem"
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, padding: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border border-[#111C2D] bg-[#0B1422] rounded-2xl p-5 break-inside-avoid mb-7 overflow-hidden"
                      >
                        <header className="flex items-center gap-2.5">
                          <img src={comment.avatar} alt={"Avatar de " + comment.name} loading="lazy" width="80" height="80" className="w-16 aspect-square rounded-full object-cover" />
                          <div>
                            <h3 className="text-lg font-semibold">{comment.name}</h3>
                            <p className="text-white/60">{format(comment.date)}</p>
                          </div>
                        </header>
                        <p className="text-white/70 mt-2.5">{comment.text}</p>
                        <div className="flex justify-between items-center mt-4 relative">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => handleLike(comment.id)}
                              className="text-white/60 hover:text-blue-500"
                              whileTap={{ scale: 0.9 }}
                              aria-label="Reaccionar a este comentario"
                              id={"emoji-btn-" + comment.id}
                            >
                              {comment.emoji}
                            </motion.button>
                            {emojiPickers[comment.id] && (
                              <div id={"emoji-picker-" + comment.id} className="absolute bottom-10 left-0 bg-white p-2 rounded-lg shadow-lg z-10">
                                <EmojiPicker onEmojiClick={(emojiObject) => handleEmojiSelect(emojiObject, comment.id)} />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-white/30 hover:text-red-400 transition-colors text-sm"
                            aria-label={"Eliminar comentario de " + comment.name}
                          >
                            {"\u{1F5D1}"}
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {!showAll && comments.length > 6 && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B1422] to-transparent pointer-events-none" aria-hidden="true"></div>
                )}
              </div>
              {comments.length > 6 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="py-2.5 px-4 justify-center rounded-[10px] font-bold border flex items-center gap-x-2.5 leading-none hover:scale-105 transition-transform duration-300 shadow-button bg-brand-blue text-white border-brand-blue absolute bottom-4 left-1/2 -translate-x-1/2"
                  aria-label={showAll ? "Mostrar menos comentarios" : "Mostrar m\u00e1s comentarios"}
                >
                  {showAll ? "Ver menos" : "Ver m\u00e1s"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommentSection;
