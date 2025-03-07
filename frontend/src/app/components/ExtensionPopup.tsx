'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  CircularProgress, 
  Typography 
} from '@mui/material';

export default function ExtensionPopup() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [perspective, setPerspective] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);

 
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  async function handleAnalyze() {
    try {
      setIsLoading(true);
      setError('');
      setSummary('');
      setPerspective('');

    
      const summaryRes = await fetch('http://localhost:8000/scrape-and-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl })
      });
      if (!summaryRes.ok) {
        throw new Error(`Summary fetch failed: ${summaryRes.statusText}`);
      }
      const summaryData = await summaryRes.json();
      const summaryText = summaryData.summary || '';
      setSummary(summaryText);

    
      const perspectiveRes = await fetch('http://localhost:8000/generate-perspective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: summaryText })
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
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Analysis Popup
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Perspective AI Extension</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Current Tab: {currentUrl}
          </Typography>
          <Button 
            onClick={handleAnalyze} 
            disabled={!currentUrl || isLoading} 
            variant="contained"
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Page'}
          </Button>
          {isLoading && (
            <CircularProgress size={24} sx={{ mt: 2 }} />
          )}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              Error: {error}
            </Typography>
          )}
          {summary && (
            <>
              <Typography variant="h6" sx={{ mt: 3 }}>Summary:</Typography>
              <Typography variant="body2">{summary}</Typography>
            </>
          )}
          {perspective && (
            <>
              <Typography variant="h6" sx={{ mt: 3 }}>Counter Perspective:</Typography>
              <Typography variant="body2">{perspective}</Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
