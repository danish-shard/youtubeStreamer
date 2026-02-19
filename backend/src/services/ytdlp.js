import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

/**
 * Validate that URL is a YouTube URL.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return YOUTUBE_REGEX.test(url.trim());
}

/**
 * Get video metadata (title, thumbnail) via yt-dlp.
 * Uses --print to fetch only the fields we need instead of --dump-json,
 * which produces multi-MB output that easily exceeds Node's exec buffer.
 * @param {string} url - YouTube URL
 * @returns {Promise<{ title: string, thumbnail: string }>}
 */
export async function getInfo(url) {
  const u = url.trim();
  const { stdout } = await execAsync(
    `yt-dlp --no-download --no-warnings --no-playlist --print "%(title)s\n%(thumbnail)s" "${u}"`,
    { maxBuffer: 1024 * 1024, timeout: 30000 }
  );
  const lines = stdout.trim().split('\n');
  return {
    title: lines[0] || 'Unknown',
    thumbnail: lines[1] || '',
  };
}

/**
 * Get direct stream URL(s) for playback.
 * For video: returns { videoUrl, audioUrl } since YouTube serves them as separate DASH streams.
 * For audio: returns { audioUrl }.
 * @param {string} url - YouTube URL
 * @param {boolean} audioOnly
 * @returns {Promise<{ videoUrl?: string, audioUrl: string }>}
 */
export async function getStreamUrl(url, audioOnly = false) {
  const u = url.trim();

  if (audioOnly) {
    const { stdout } = await execAsync(
      `yt-dlp -g -f "bestaudio[ext=m4a]/bestaudio" --no-playlist --no-warnings "${u}"`,
      { maxBuffer: 2 * 1024 * 1024, timeout: 30000 }
    );
    return { audioUrl: stdout.trim().split('\n')[0] };
  }

  const { stdout } = await execAsync(
    `yt-dlp -g -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --no-playlist --no-warnings "${u}"`,
    { maxBuffer: 2 * 1024 * 1024, timeout: 30000 }
  );
  const lines = stdout.trim().split('\n');
  if (lines.length >= 2) {
    return { videoUrl: lines[0], audioUrl: lines[1] };
  }
  return { videoUrl: lines[0], audioUrl: lines[0] };
}

/**
 * Download to a temp file and return path. Caller should unlink when done.
 * @param {string} url - YouTube URL
 * @param {boolean} audioOnly - If true, download best audio and convert to mp3 if needed
 * @returns {Promise<{ filePath: string, title: string }>}
 */
export async function downloadToTemp(url, audioOnly = false) {
  const u = url.trim();
  const tmpDir = path.join(__dirname, '../../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const { stdout: idOut } = await execAsync(
    `yt-dlp --no-playlist --print id "${u}"`,
    { maxBuffer: 1024, timeout: 30000 }
  );
  const id = idOut.trim();
  const ext = audioOnly ? 'mp3' : '%(ext)s';
  const outTemplate = path.join(tmpDir, `${id}.${ext}`);

  if (audioOnly) {
    await execAsync(
      `yt-dlp --no-playlist -x --audio-format mp3 -f bestaudio -o "${outTemplate}" "${u}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }
    );
  } else {
    await execAsync(
      `yt-dlp --no-playlist -o "${outTemplate}" -f b "${u}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }
    );
  }

  const actualPath = audioOnly
    ? path.join(tmpDir, `${id}.mp3`)
    : (() => {
        const existing = fs.readdirSync(tmpDir).find((f) => f.startsWith(id + '.'));
        return existing ? path.join(tmpDir, existing) : path.join(tmpDir, id);
      })();

  const { stdout: titleOut } = await execAsync(
    `yt-dlp --no-playlist --print title "${u}"`,
    { maxBuffer: 4096, timeout: 30000 }
  );
  const title = titleOut.trim().replace(/[<>:"/\\|?*]/g, '_').slice(0, 200) || 'video';

  return { filePath: actualPath, title };
}
