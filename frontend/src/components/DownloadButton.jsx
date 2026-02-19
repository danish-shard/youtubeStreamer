import { useState } from 'react';

export default function DownloadButton({ url, audioOnly, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    if (!url || disabled) return;
    setLoading(true);
    setError(null);
    try {
      const { download } = await import('../api/client.js');
      await download(url, audioOnly);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        onClick={handleDownload}
        disabled={disabled || loading}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 6,
          border: '1px solid #555',
          background: '#333',
          color: '#eee',
        }}
      >
        {loading ? 'Downloading…' : `Download ${audioOnly ? 'audio' : 'video'}`}
      </button>
      {error && (
        <span style={{ marginLeft: '0.5rem', color: '#e66', fontSize: '0.9rem' }}>
          {error}
        </span>
      )}
    </div>
  );
}
