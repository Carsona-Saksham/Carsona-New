// Analytics helper
// Usage: import { track } from '/static/appjs/analytics.js';
//        track('event_name', { extra: 'data' });

export function track(eventName, opts = {}) {
  const payload = {
    event_name : eventName,
    path       : window.location.pathname + window.location.hash,
    clicked_on : opts.clicked_on || null,
    metadata   : opts.metadata || {}
  };

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/track', blob);
  } catch(e) {
    // Fallback – async XHR
    fetch('/api/track', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload)
    }).catch(() => {});
  }
}

// Auto-track clicks on:* any element with data-track-click OR any <button> or <a>
// This reduces the chances of `clicked_on` being null in analytics
document.addEventListener('click', (evt) => {
  const el = evt.target.closest('[data-track-click], button, a');
  if (!el) return;

  // Derive a readable label
  let label = 'unknown';
  if (el.dataset && el.dataset.trackClick) {
    label = el.dataset.trackClick;
  } else if (el.innerText && el.innerText.trim()) {
    label = el.innerText.trim();
  } else if (el.getAttribute && el.getAttribute('aria-label')) {
    label = el.getAttribute('aria-label');
  } else if (el.id) {
    label = el.id;
  } else {
    label = el.tagName;
  }

  track('click', { clicked_on: label });
}); 