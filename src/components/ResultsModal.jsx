import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  FaSquareXTwitter,
  FaFacebookF,
  FaWhatsapp,
  FaInstagram,
  FaRedditAlien,
  FaLink,
} from 'react-icons/fa6';

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - now;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

export default function ResultsModal({
  puzzle,
  guesses,
  gameStatus,
  maxAttempts,
  onClose,
}) {
  const countdown = useCountdown();
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const isWin = gameStatus === 'won';
  const score = isWin ? guesses.length : 'X';

  const buildShareText = useCallback(() => {
    if (!puzzle) return '';
    const emojis = guesses.map((g) => {
      if (g === '') return '⬛';
      if (g.toLowerCase() === puzzle.song.title.toLowerCase()) return '🟩';
      return '🟥';
    });
    while (emojis.length < maxAttempts) emojis.push('⬜');
    return `Beadle #${puzzle.puzzleNumber} ${score}/${maxAttempts}\n\n${emojis.join('')}\n\nbeadle`;
  }, [guesses, puzzle, maxAttempts, score]);

  const handleCopyLink = useCallback(async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, []);

  // Show modal when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      // Small delay for dramatic effect
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [gameStatus]);

  // Early return after all hooks
  if (!visible || gameStatus === 'playing') return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const shareText = buildShareText();
  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : 'beadle';
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = [
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      className: 'share-x',
      icon: <FaSquareXTwitter className="share-icon" />,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      className: 'share-facebook',
      icon: <FaFacebookF className="share-icon" />,
    },
    {
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
      className: 'share-whatsapp',
      icon: <FaWhatsapp className="share-icon" />,
    },
    {
      label: 'Instagram',
      href: `instagram://story-camera`,
      className: 'share-instagram',
      icon: <FaInstagram className="share-icon" />,
      onClick: async (e) => {
        e.preventDefault();
        const sharePayload = {
          title: 'Beadle',
          text: shareText,
          url: shareUrl,
        };
        if (navigator.share) {
          try {
            await navigator.share(sharePayload);
            return;
          } catch {}
        }
        try {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        } catch {}
        window.location.href = 'instagram://story-camera';
        setTimeout(() => {
          window.open(
            'https://www.instagram.com/',
            '_blank',
            'noopener,noreferrer',
          );
        }, 400);
      },
    },
    {
      label: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
      className: 'share-reddit',
      icon: <FaRedditAlien className="share-icon" />,
    },
  ];

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <h2 className={`modal-title ${isWin ? 'win' : 'lose'}`}>
          {isWin ? 'Congrats, you got it right!' : 'Better luck next time'}
        </h2>

        <div className="answer-reveal">
          <span className="answer-label">The answer was</span>
          <span className="answer-song">{puzzle.song.title}</span>
          <span className="answer-artist">The Beatles</span>
        </div>

        <div className="emoji-card">{shareText}</div>

        <div className="share-grid">
          {shareLinks.map((link) => (
            <a
              key={link.label}
              className={`share-link ${link.className}`}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
          <button
            type="button"
            className="share-copy"
            onClick={() => handleCopyLink(shareUrl)}
          >
            <FaLink className="share-icon" />
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>

        <div className="next-puzzle">
          <span className="next-puzzle-label">Next Beadle in</span>
          <span className="next-puzzle-timer">{countdown}</span>
        </div>
      </div>
    </div>
  );
}
