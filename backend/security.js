const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getAllowedOrigins({ includeDev = false } = {}) {
  const configured = [process.env.FRONTEND_ORIGIN, process.env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const defaults = includeDev
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [];

  return new Set([...defaults, ...configured]);
}

export function requireTrustedOrigin(allowedOrigins, { requireOrigin }) {
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      next();
      return;
    }

    const origin = req.get('origin');
    const referer = req.get('referer');
    const refererOrigin = referer ? safeOrigin(referer) : '';
    const requestOrigin = origin || refererOrigin;

    if (!requestOrigin && !requireOrigin) {
      next();
      return;
    }

    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
      next();
      return;
    }

    res.status(403).json({ error: 'Origin not allowed' });
  };
}

export function createRateLimit({
  windowMs,
  max,
  methods,
  keyPrefix,
  message = 'Too many requests',
}) {
  const hits = new Map();
  const methodSet = methods ? new Set(methods) : null;

  return (req, res, next) => {
    if (methodSet && !methodSet.has(req.method)) {
      next();
      return;
    }

    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

export function validateUid(uid) {
  return typeof uid === 'string' && UUID_RE.test(uid);
}

export function validateName(name) {
  if (typeof name !== 'string') return '';
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 1 || trimmed.length > 24) return '';
  if (/[\x00-\x1f\x7f<>]/.test(trimmed)) return '';
  return trimmed;
}

export function validateInteger(value, { min, max }) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

export async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || typeof token !== 'string') return false;

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  if (remoteIp) params.set('remoteip', remoteIp);

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    },
  );

  if (!response.ok) return false;
  const data = await response.json();
  return data.success === true;
}

function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}
