import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { TURNSTILE_SITE_KEY, isTurnstileEnabled } from '../utils/security';

export default function NamePromptModal({
  open,
  title,
  onClose,
  onSubmit,
  defaultValue = '',
}) {
  const [name, setName] = useState(defaultValue);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(defaultValue);
      setTurnstileToken('');
    }
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open || !isTurnstileEnabled()) return undefined;

    let cancelled = false;

    const renderWidget = () => {
      if (
        cancelled ||
        !turnstileRef.current ||
        !window.turnstile ||
        widgetIdRef.current !== null
      ) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    };

    if (!document.getElementById('turnstile-loader')) {
      const script = document.createElement('script');
      script.id = 'turnstile-loader';
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }

    const intervalId = window.setInterval(renderWidget, 250);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isTurnstileEnabled() && !turnstileToken) return;
    onSubmit(trimmed, turnstileToken);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>
        <h2 className="modal-title win">{title}</h2>
        <form className="name-form" onSubmit={handleSubmit}>
          <input
            className="name-input"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
          {isTurnstileEnabled() && (
            <div className="turnstile-widget" ref={turnstileRef} />
          )}
          <button
            className="btn-primary"
            type="submit"
            disabled={isTurnstileEnabled() && !turnstileToken}
          >
            Save to leaderboard
          </button>
        </form>
      </div>
    </div>
  );
}
