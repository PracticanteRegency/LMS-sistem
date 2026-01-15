// dedupe.js
// Simple deduplication utility for API calls (JS fallback for legacy imports)
const pending = {};

export default function dedupe(key, _payload, fn) {
  if (!pending[key]) {
    pending[key] = fn().finally(() => {
      delete pending[key];
    });
  }
  return pending[key];
}
