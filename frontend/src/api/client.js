const API_BASE = import.meta.env.VITE_API_URL ?? '';

function qs(params) {
  return new URLSearchParams(params).toString();
}

export async function getInfo(url) {
  const res = await fetch(`${API_BASE}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to get info');
  }
  return res.json();
}

export async function getStreamUrls(url, audioOnly) {
  const params = qs({ url: url.trim(), audioOnly: audioOnly ? 'true' : 'false' });
  const res = await fetch(`${API_BASE}/api/stream?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to get stream URL');
  }
  return res.json();
}

export async function download(url, audioOnly) {
  const params = qs({ url: url.trim(), audioOnly: audioOnly ? 'true' : 'false' });
  const res = await fetch(`${API_BASE}/api/download?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition && disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1].trim() : (audioOnly ? 'audio.mp3' : 'video.mp4');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
