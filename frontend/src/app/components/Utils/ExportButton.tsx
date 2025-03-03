
import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import jsPDF from 'jspdf';

const ExportButton = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // pdf sample
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Multi-Perspective Analysis", 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Article Summary:", 20, 30);
    doc.text("This is a sample article summary for testing the export functionality.", 20, 40);
    
    doc.text("AI Perspective:", 20, 50);
    doc.text("This article presents multiple viewpoints on the topic.", 20, 60);
    doc.text("The key arguments made include economic, social, and environmental factors.", 20, 70);
  
    doc.save('perspective-analysis.pdf');
    handleClose();
  };
  
  const exportToDoc = () => {
    const content = `
Multi-Perspective Analysis

Article Summary:
This is a sample article summary for testing the export functionality.

Discussion:
AI: Hello! I've analyzed the article. What would you like to know about it?
User: Can you explain the main arguments?
AI: The article presents three main arguments about the topic...
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perspective-analysis.txt';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    handleClose();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
  <Button
    variant="contained"
    color="primary"
    startIcon={<SaveIcon />}
    onClick={handleClick}
    size="small"
    sx={{
      px: 3,
      py: 1, 
      fontSize: "1rem",
      fontWeight: "bold",
      borderRadius: "8px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", 
      transition: "0.3s",
      "&:hover": {
        backgroundColor: "primary.dark",
        transform: "scale(1.05)", 
      },
    }}
  >
    Save
  </Button>
</Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={exportToPDF}>
          <FileDownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={exportToDoc}>
          <FileDownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Export as DOC
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;