import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';

const Navbar = () => {
  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1}>
          <StarIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Opposing Perspective AI
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/"
          color="primary"
          sx={{ textTransform: 'none' }}
        >
          Home
        </Button>
        <Button
          color="primary"
          variant="contained"
          sx={{
            ml: 2,
            textTransform: 'none',
            borderRadius: '20px',
          }}
        >
          Get Started
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 