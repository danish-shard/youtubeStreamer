# YouTube Tool

Personal/dummy project: play YouTube videos without ads in the browser, switch to audio-only playback, and download video or audio. Built with React (Vite) and Node.js (Express). Uses **yt-dlp** and **ffmpeg** on the backend.

**Use only for your own content or for private learning. Do not deploy publicly or redistribute downloaded content.**

## Prerequisites

- **Node.js** 18+
- **yt-dlp** – [install](https://github.com/yt-dlp/yt-dlp#installation) and ensure it’s on your PATH
- **ffmpeg** – [install](https://ffmpeg.org/download.html) and on PATH (needed for audio extraction/conversion)

## Setup and run

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Server runs at `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` and proxies `/api` to the backend.

## Usage

1. Paste a YouTube URL and click **Load**.
2. Use **Audio only** to switch between video and audio-only playback.
3. Use **Download video** / **Download audio** to save the file.

## Project structure

- `backend/` – Express API: `/api/info`, `/api/stream`, `/api/download`
- `frontend/` – React app (Vite) with UrlInput, Player, AudioToggle, DownloadButton
# youtubeStreamer
