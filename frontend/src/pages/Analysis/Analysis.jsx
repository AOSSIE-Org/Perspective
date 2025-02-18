import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api';

const Analysis = () => {
  const location = useLocation();
  const { url, content } = location.state || {};
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    const getSummary = async () => {
      try {
        const data = await api.getArticleSummary(url);
        setChat([
          { type: 'bot', content: 'Here\'s a summary of the article:' },
          { type: 'bot', content: data.summary },
        ]);
      } catch (err) {
        setError(err.message || 'Failed to get article summary');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      getSummary();
    }
  }, [url]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      setChat([...chat, { type: 'user', content: message }]);
      // Placeholder for future AI chat integration
      setChat(prev => [...prev, { 
        type: 'bot', 
        content: 'This is a placeholder response. AI chat will be integrated soon.' 
      }]);
      setMessage('');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Article Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Analyzing: {url}
        </Typography>
        
        <Paper sx={{ mt: 4, p: 3, borderRadius: 2 }}>
          <Box sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {chat.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.type === 'bot' && (
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: 2,
                        width: 32,
                        height: 32,
                      }}
                    >
                      AI
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: msg.type === 'user' ? 'primary.main' : 'grey.100',
                      color: msg.type === 'user' ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography variant="body1">{msg.content}</Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about the article..."
                variant="outlined"
                size="small"
              />
              <IconButton type="submit" color="primary">
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Analysis; 