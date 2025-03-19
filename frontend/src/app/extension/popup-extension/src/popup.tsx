// popup-extension/src/popup.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from "react-dom/client";

// Declare the chrome global to satisfy TypeScript
declare const chrome: any;

function Popup() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [perspective, setPerspective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // On load, get the active tab URL (only works in extension context)
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const url = tabs[0]?.url || '';
      setCurrentUrl(url);
    });
  }, []);

  async function handleAnalyze() {
    try {
      setIsLoading(true);
      setError('');
      setSummary('');
      setPerspective('');

      // Call /scrape-and-summarize endpoint
      const summaryRes = await fetch('http://localhost:8000/scrape-and-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl }),
      });
      if (!summaryRes.ok) {
        throw new Error(`Summary fetch failed: ${summaryRes.statusText}`);
      }
      const summaryData = await summaryRes.json();
      const summaryText = summaryData.summary || '';
      setSummary(summaryText);

      // Call /generate-perspective endpoint
      const perspectiveRes = await fetch('http://localhost:8000/generate-perspective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: summaryText }),
      });
      if (!perspectiveRes.ok) {
        throw new Error(`Perspective fetch failed: ${perspectiveRes.statusText}`);
      }
      const perspectiveData = await perspectiveRes.json();
      setPerspective(perspectiveData.perspective || '');
    } catch (err: any) {
      setError(err.message || 'Error analyzing page');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minWidth: '300px', padding: '10px', fontFamily: 'sans-serif' }}>
      <h2>Perspective AI Extension</h2>
      <p>Current Tab: {currentUrl}</p>
      <button onClick={handleAnalyze} disabled={!currentUrl || isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze Page'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {summary && (
        <div style={{ marginTop: '10px' }}>
          <h4>Summary:</h4>
          <p>{summary}</p>
        </div>
      )}
      {perspective && (
        <div style={{ marginTop: '10px' }}>
          <h4>Counter Perspective:</h4>
          <p>{perspective}</p>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Popup />);
}
