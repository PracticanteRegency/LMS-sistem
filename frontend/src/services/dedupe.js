// dedupe.js
// Simple deduplication utility for API calls (JS fallback for legacy imports)
const pending = {};

export default function dedupe(key, payload, fn) {
  const fullKey = payload != null ? `${key}:${JSON.stringify(payload)}` : key;
  if (!pending[fullKey]) {
    pending[fullKey] = fn().finally(() => {
      delete pending[fullKey];
    });
  }
  return pending[fullKey];
}
