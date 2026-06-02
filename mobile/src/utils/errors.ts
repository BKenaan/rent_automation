/**
 * Always returns a human-readable string from any error shape.
 * Critically, FastAPI validation errors return `detail` as an ARRAY of objects —
 * rendering that array in a <Text> crashes React Native. This normalises it.
 */
export function getErrorMessage(error: any, fallback = 'Something went wrong. Please try again.'): string {
  // Network / timeout (no response)
  if (error?.message === 'Network Error') {
    return 'No internet connection. Please check your network and try again.';
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.';
  }

  const detail = error?.response?.data?.detail;

  // Plain string detail (most of our backend errors)
  if (typeof detail === 'string') return detail;

  // FastAPI 422 validation errors → array of { loc, msg, type }
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d: any) => {
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : '';
        const msg = typeof d?.msg === 'string' ? d.msg : '';
        if (!msg) return '';
        return field ? `${prettify(String(field))}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join('\n');
  }

  // Single object detail
  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    return detail.msg;
  }

  // HTTP status fallbacks
  const status = error?.response?.status;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'That item could not be found.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500)  return 'The server had a problem. Please try again shortly.';

  if (typeof error?.message === 'string' && error.message) return error.message;
  return fallback;
}

function prettify(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
