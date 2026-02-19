import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

// Seed cookies from base64 env var on startup if provided.
if (process.env.COOKIES_BASE64) {
  fs.writeFileSync(COOKIES_PATH, Buffer.from(process.env.COOKIES_BASE64, 'base64').toString('utf-8'));
  console.log('Cookies file written from COOKIES_BASE64 env var');
}

function cookiesFlag() {
  return fs.existsSync(COOKIES_PATH) ? `--cookies "${COOKIES_PATH}"` : '';
}

export function hasCookies() {
  return fs.existsSync(COOKIES_PATH);
}

export function setCookies(cookieText) {
  fs.writeFileSync(COOKIES_PATH, cookieText, 'utf-8');
}

export function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return YOUTUBE_REGEX.test(url.trim());
}

export async function getInfo(url) {
  const u = url.trim();
  const { stdout } = await execAsync(
    `yt-dlp --no-download --no-warnings --no-playlist ${cookiesFlag()} --print "%(title)s\n%(thumbnail)s" "${u}"`,
    { maxBuffer: 1024 * 1024, timeout: 30000 }
  );
  const lines = stdout.trim().split('\n');
  return {
    title: lines[0] || 'Unknown',
    thumbnail: lines[1] || '',
  };
}

export async function getStreamUrl(url, audioOnly = false) {
  const u = url.trim();
  const cf = cookiesFlag();

  if (audioOnly) {
    const { stdout } = await execAsync(
      `yt-dlp -g -f "bestaudio[ext=m4a]/bestaudio" --no-playlist --no-warnings ${cf} "${u}"`,
      { maxBuffer: 2 * 1024 * 1024, timeout: 30000 }
    );
    return { audioUrl: stdout.trim().split('\n')[0] };
  }

  const { stdout } = await execAsync(
    `yt-dlp -g -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --no-playlist --no-warnings ${cf} "${u}"`,
    { maxBuffer: 2 * 1024 * 1024, timeout: 30000 }
  );
  const lines = stdout.trim().split('\n');
  if (lines.length >= 2) {
    return { videoUrl: lines[0], audioUrl: lines[1] };
  }
  return { videoUrl: lines[0], audioUrl: lines[0] };
}

export async function downloadToTemp(url, audioOnly = false) {
  const u = url.trim();
  const cf = cookiesFlag();
  const tmpDir = path.join(__dirname, '../../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const { stdout: idOut } = await execAsync(
    `yt-dlp --no-playlist ${cf} --print id "${u}"`,
    { maxBuffer: 1024, timeout: 30000 }
  );
  const id = idOut.trim();
  const ext = audioOnly ? 'mp3' : '%(ext)s';
  const outTemplate = path.join(tmpDir, `${id}.${ext}`);

  if (audioOnly) {
    await execAsync(
      `yt-dlp --no-playlist ${cf} -x --audio-format mp3 -f bestaudio -o "${outTemplate}" "${u}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }
    );
  } else {
    await execAsync(
      `yt-dlp --no-playlist ${cf} -o "${outTemplate}" -f b "${u}"`,
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
    `yt-dlp --no-playlist ${cf} --print title "${u}"`,
    { maxBuffer: 4096, timeout: 30000 }
  );
  const title = titleOut.trim().replace(/[<>:"/\\|?*]/g, '_').slice(0, 200) || 'video';

  return { filePath: actualPath, title };
}
