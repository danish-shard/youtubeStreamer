import { useState, useEffect, useCallback } from 'react';
import { getInfo, getStreamUrls, getCookieStatus, submitCookies } from './api/client.js';
import UrlInput from './components/UrlInput.jsx';
import Player from './components/Player.jsx';
import AudioToggle from './components/AudioToggle.jsx';
import DownloadButton from './components/DownloadButton.jsx';
import CookieInput from './components/CookieInput.jsx';

export default function App() {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookiesActive, setCookiesActive] = useState(false);

  useEffect(() => {
    getCookieStatus().then(({ hasCookies }) => setCookiesActive(hasCookies));
  }, []);

  const fetchStream = useCallback(async (targetUrl, isAudioOnly) => {
    if (!targetUrl) {
      setStreamData(null);
      return;
    }
    try {
      const data = await getStreamUrls(targetUrl, isAudioOnly);
      setStreamData(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  async function handleLoad(inputUrl) {
    setLoading(true);
    setError(null);
    setInfo(null);
    setStreamData(null);
    try {
      const data = await getInfo(inputUrl);
      setUrl(inputUrl);
      setInfo(data);
      const streams = await getStreamUrls(inputUrl, audioOnly);
      setStreamData(streams);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!url) return;
    setStreamData(null);
    fetchStream(url, audioOnly);
  }, [audioOnly]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>YouTube Tool</h1>
      <CookieInput
        hasCookies={cookiesActive}
        onSubmit={async (text) => {
          await submitCookies(text);
          setCookiesActive(true);
        }}
      />
      <UrlInput onLoad={handleLoad} loading={loading} />
      {error && (
        <p style={{ color: '#e66', marginBottom: '1rem' }}>{error}</p>
      )}
      {info && (
        <>
          <AudioToggle
            audioOnly={audioOnly}
            onChange={setAudioOnly}
            disabled={!url}
          />
          <Player
            streamData={streamData}
            title={info.title}
            thumbnail={info.thumbnail}
            audioOnly={audioOnly}
          />
          <DownloadButton url={url} audioOnly={audioOnly} disabled={!url} />
        </>
      )}
    </div>
  );
}
