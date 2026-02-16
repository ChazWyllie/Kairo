/* ======================================================
   Kairo — Feedback & Preference System
   Persists user reactions in localStorage and exposes
   a floating widget on each landing-page variant.
   ====================================================== */

const STORAGE_KEY = 'kairo_showcase_feedback';

/** Read all feedback from localStorage */
function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

/** Write feedback to localStorage */
function saveFeedback(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Record a reaction for a specific page variant */
function recordReaction(pageId, reaction, notes) {
  const fb = loadFeedback();
  if (!fb[pageId]) fb[pageId] = { reactions: [], notes: [] };
  fb[pageId].reactions.push({ reaction, ts: Date.now() });
  if (notes) fb[pageId].notes.push({ text: notes, ts: Date.now() });
  saveFeedback(fb);
  return fb;
}

/** Get aggregated preference scores for all pages */
function getPreferences() {
  const fb = loadFeedback();
  const scores = {};
  for (const [pageId, data] of Object.entries(fb)) {
    const positive = data.reactions.filter(r => r.reaction === 'love' || r.reaction === 'like').length;
    const negative = data.reactions.filter(r => r.reaction === 'dislike').length;
    scores[pageId] = { positive, negative, net: positive - negative, notes: data.notes || [] };
  }
  return scores;
}

/** Inject the floating feedback widget into the page */
function mountFeedbackWidget(pageId, pageName) {
  const fb = loadFeedback();
  const existing = fb[pageId] || { reactions: [], notes: [] };
  const lastReaction = existing.reactions.length > 0
    ? existing.reactions[existing.reactions.length - 1].reaction
    : null;

  const widget = document.createElement('div');
  widget.id = 'feedback-widget';
  widget.innerHTML = `
    <div class="fw-toggle" id="fw-toggle" title="Give feedback on this design">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <div class="fw-panel" id="fw-panel">
      <div class="fw-header">
        <span class="fw-title">Rate "${pageName}"</span>
        <button class="fw-close" id="fw-close">&times;</button>
      </div>
      <div class="fw-reactions">
        <button class="fw-btn ${lastReaction === 'love' ? 'active' : ''}" data-reaction="love" title="Love it">❤️</button>
        <button class="fw-btn ${lastReaction === 'like' ? 'active' : ''}" data-reaction="like" title="Like it">👍</button>
        <button class="fw-btn ${lastReaction === 'dislike' ? 'active' : ''}" data-reaction="dislike" title="Needs work">👎</button>
      </div>
      <textarea class="fw-notes" id="fw-notes" placeholder="What would you change? (optional)" rows="3"></textarea>
      <button class="fw-submit" id="fw-submit">Submit Feedback</button>
      <div class="fw-thanks" id="fw-thanks">Thanks! Your feedback shapes future designs.</div>
    </div>
  `;
  document.body.appendChild(widget);

  // State
  let selectedReaction = lastReaction;
  const panel  = document.getElementById('fw-panel');
  const toggle = document.getElementById('fw-toggle');

  toggle.addEventListener('click', () => panel.classList.toggle('open'));
  document.getElementById('fw-close').addEventListener('click', () => panel.classList.remove('open'));

  widget.querySelectorAll('.fw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      widget.querySelectorAll('.fw-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedReaction = btn.dataset.reaction;
    });
  });

  document.getElementById('fw-submit').addEventListener('click', () => {
    if (!selectedReaction) return;
    const notes = document.getElementById('fw-notes').value.trim();
    recordReaction(pageId, selectedReaction, notes || null);
    document.getElementById('fw-thanks').classList.add('show');
    setTimeout(() => {
      panel.classList.remove('open');
      document.getElementById('fw-thanks').classList.remove('show');
    }, 1800);
  });
}

// Export for use in pages
if (typeof window !== 'undefined') {
  window.KairoFeedback = { mountFeedbackWidget, getPreferences, loadFeedback };
}
