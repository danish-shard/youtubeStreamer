import { useState } from 'react';

export default function UrlInput({ onLoad, loading }) {
  const [url, setUrl] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) onLoad(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube URL..."
        disabled={loading}
        style={{
          flex: 1,
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          border: '1px solid #444',
          background: '#2a2a2a',
          color: '#eee',
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 6,
          border: '1px solid #555',
          background: '#333',
          color: '#eee',
        }}
      >
        {loading ? 'Loading…' : 'Load'}
      </button>
    </form>
  );
}
