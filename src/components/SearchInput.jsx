import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import songs from '../data/songs';

export default function SearchInput({ onSubmit, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);

  // Filter
  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    setResults(songs.filter((s) => s.title.toLowerCase().includes(q)));
    setOpen(true);
    setActiveIdx(-1);
  }, [query]);

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const select = useCallback(
    (title) => {
      setQuery('');
      setOpen(false);
      onSubmit(title);
    },
    [onSubmit],
  );

  const onKey = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      select(results[activeIdx].title);
    }
  };

  return (
    <div className="search-box" ref={wrapRef}>
      <div className="search-field-wrap">
        <Search size={18} className="search-field-icon" />
        <input
          className="search-field"
          type="text"
          placeholder="Know it? Search the song title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setOpen(true)}
          onKeyDown={onKey}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="dropdown" role="listbox">
          {results.map((song, i) => (
            <li
              key={song.id}
              role="option"
              aria-selected={i === activeIdx}
              className={`dropdown-item${i === activeIdx ? ' active' : ''}`}
              onClick={() => select(song.title)}
            >
              {song.title}
              <span className="dropdown-artist">The Beatles</span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length > 0 && results.length === 0 && (
        <div className="dropdown">
          <div className="dropdown-empty">No songs match "{query}"</div>
        </div>
      )}
    </div>
  );
}
