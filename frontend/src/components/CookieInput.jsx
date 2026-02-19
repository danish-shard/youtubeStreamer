import { useState } from 'react';

export default function CookieInput({ onSubmit, hasCookies }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      await onSubmit(text);
      setMsg({ type: 'ok', text: 'Cookies saved!' });
      setText('');
      setTimeout(() => setOpen(false), 1500);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          padding: '0.4rem 0.75rem',
          borderRadius: 6,
          border: '1px solid #555',
          background: hasCookies ? '#2a3a2a' : '#3a2a2a',
          color: '#eee',
          fontSize: '0.85rem',
        }}
      >
        {hasCookies ? 'Cookies active — Update' : 'Set YouTube Cookies'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: '0.5rem' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Paste your cookies.txt content here...\n\nHow to get cookies:\n1. Install "Get cookies.txt LOCALLY" browser extension\n2. Go to youtube.com (make sure you\'re signed in)\n3. Click the extension → Export\n4. Paste the content here'}
            rows={6}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 6,
              border: '1px solid #444',
              background: '#2a2a2a',
              color: '#eee',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 6,
                border: '1px solid #555',
                background: '#333',
                color: '#eee',
              }}
            >
              {saving ? 'Saving…' : 'Save Cookies'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setText(''); setMsg(null); }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 6,
                border: '1px solid #444',
                background: 'transparent',
                color: '#aaa',
              }}
            >
              Cancel
            </button>
            {msg && (
              <span style={{ fontSize: '0.85rem', color: msg.type === 'ok' ? '#6c6' : '#e66' }}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
