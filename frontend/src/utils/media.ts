// Utilities to normalize media URLs coming from the backend.
// Some backends may return raw base64 string (without data:<type>;base64,...) or full data URLs.
import { API_URL } from "../services/axios";

export function normalizeDataUrl(value?: string | null, prefer: 'image' | 'pdf' | 'video' = 'image') {
  if (!value) return '';
  let s = String(value).trim();
  if (!s) return '';

  // Strip common wrappers: quotes and Python bytes literal (b'...')
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1);
  }
  if ((s.startsWith("b'") && s.endsWith("'")) || (s.startsWith('b"') && s.endsWith('"'))) {
    s = s.slice(2, -1);
  }

  // Already a data URL
  if (s.startsWith('data:')) return s;

  // Normalize relative media paths from backend to absolute URL
  const base = (API_URL || '').replace(/\/+$/, '');
  const looksRelativeMedia =
    s.startsWith('/media') ||
    s.startsWith('/uploads') ||
    s.startsWith('media/') ||
    s.startsWith('uploads/') ||
    (/^media\//i.test(s)) ||
    (/^uploads\//i.test(s));

  if (looksRelativeMedia && base) {
    try {
      return new URL(s, base + '/').href;
    } catch (e) {
      // fallback: simple concat
      return `${base}${s.startsWith('/') ? '' : '/'}${s}`;
    }
  }

  // Looks like a remote URL
  if (/^(https?:|blob:|file:)/i.test(s) || s.startsWith('/')) return s;

  // Some backends mistakenly convert '+' to ' ' (space). Restore '+' first.
  const plusFixed = s.includes('/9j/') || s.includes('iVBOR') || /base64,/i.test(s) ? s.replace(/\s/g, (m) => (m === ' ' ? '+' : m)) : s;
  const compact = plusFixed.replace(/\s+/g, '');
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100;

  if (isBase64) {
    // Try to detect common MIME types by base64 signature
    // JPEG: starts with /9j/
    // PNG: starts with iVBOR
    // GIF: starts with R0lGOD
    // SVG: starts with PHN2Zy ("<svg")
    // PDF: starts with JVBER ("%PDF")
    // WEBP (RIFF): often starts with UklGR (not perfect)
    let mime = '';
    if (compact.startsWith('/9j/')) {
      mime = 'image/jpeg';
    } else if (compact.startsWith('iVBOR')) {
      mime = 'image/png';
    } else if (compact.startsWith('R0lGOD')) {
      mime = 'image/gif';
    } else if (compact.startsWith('PHN2Zy')) {
      mime = 'image/svg+xml';
    } else if (compact.startsWith('JVBER')) {
      mime = 'application/pdf';
    } else if (compact.startsWith('UklGR')) {
      mime = 'image/webp';
    }

    if (!mime) {
      // Fallback by preference
      if (prefer === 'pdf') mime = 'application/pdf';
      else if (prefer === 'video') mime = 'video/mp4';
      else mime = 'image/png';
    }

    return `data:${mime};base64,${compact}`;
  }

  // If contains base64 marker without proper data prefix, try to build one
  if (/base64,/i.test(s) && !s.startsWith('data:')) {
    const parts = s.split('base64,');
    const payload = parts[1] || parts[0];
    const compactPayload = String(payload || '').replace(/\s+/g, '');
    const mime = prefer === 'pdf' ? 'application/pdf' : (prefer === 'video' ? 'video/mp4' : 'image/png');
    return `data:${mime};base64,${compactPayload}`;
  }

  // Fallback: return original string
  return s;
}

export default normalizeDataUrl;
