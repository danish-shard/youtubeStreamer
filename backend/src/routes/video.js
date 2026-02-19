import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { getInfo, getStreamUrl, downloadToTemp, isValidYouTubeUrl, setCookies, hasCookies } from '../services/ytdlp.js';

const router = Router();

router.post('/info', async (req, res) => {
  try {
    const url = req.body?.url;
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Valid YouTube URL required' });
    }
    const info = await getInfo(url);
    res.json(info);
  } catch (err) {
    console.error('POST /api/info', err);
    res.status(500).json({ error: err.message || 'Failed to get video info' });
  }
});

router.get('/stream', async (req, res) => {
  try {
    const url = req.query?.url;
    const audioOnly = req.query?.audioOnly === 'true';
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Valid YouTube URL required' });
    }
    const urls = await getStreamUrl(url, audioOnly);
    res.json(urls);
  } catch (err) {
    console.error('GET /api/stream', err);
    res.status(500).json({ error: err.message || 'Failed to get stream URL' });
  }
});

router.get('/download', async (req, res) => {
  let filePath = null;
  try {
    const url = req.query?.url;
    const audioOnly = req.query?.audioOnly === 'true';
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Valid YouTube URL required' });
    }
    const { filePath: downloadedPath, title } = await downloadToTemp(url, audioOnly);
    filePath = downloadedPath;
    const ext = audioOnly ? 'mp3' : path.extname(downloadedPath).slice(1) || 'mp4';
    const filename = `${title}.${ext}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(downloadedPath, (err) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
      if (err && !res.headersSent) res.status(500).json({ error: 'Download failed' });
    });
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    console.error('GET /api/download', err);
    res.status(500).json({ error: err.message || 'Download failed' });
  }
});

router.get('/cookies/status', (req, res) => {
  res.json({ hasCookies: hasCookies() });
});

router.post('/cookies', (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies || typeof cookies !== 'string' || !cookies.trim()) {
      return res.status(400).json({ error: 'Cookie text is required' });
    }
    setCookies(cookies.trim());
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/cookies', err);
    res.status(500).json({ error: 'Failed to save cookies' });
  }
});

export default router;
