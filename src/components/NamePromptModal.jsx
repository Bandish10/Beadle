import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function NamePromptModal({
  open,
  title,
  onClose,
  onSubmit,
  defaultValue = '',
}) {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (open) setName(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
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
          <button className="btn-primary" type="submit">
            Save to leaderboard
          </button>
        </form>
      </div>
    </div>
  );
}
