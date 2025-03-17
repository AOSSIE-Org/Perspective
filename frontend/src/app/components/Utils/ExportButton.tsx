import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import jsPDF from 'jspdf';


interface ExportButtonProps {
  summary: string;
  perspective: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ summary, perspective }) => {

  const cleanText = (text: string) => {
    return text.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim();
  };

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
    const marginLeft = 15;
    const maxWidth = 180;
    const lineHeight = 10;
    const maxHeight = 280; // Usable page height
    let y = 20;

    const addTextToPDF = (title: string, text: string) => {
        doc.setFontSize(16);
        doc.text(title, marginLeft, y);
        y += lineHeight + 2; // Move down after title

        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(cleanText(text), maxWidth);

        for (let i = 0; i < splitText.length; i++) {
            if (y + lineHeight > maxHeight) {  // If out of space, add new page
                doc.addPage();
                y = 20;
            }
            doc.text(splitText[i], marginLeft, y);
            y += lineHeight; // Move down for next line
        }
        y += lineHeight; // Extra spacing after section
    };

    addTextToPDF("Summary", summary);
    addTextToPDF("AI Perspective", perspective);

    doc.save("article_analysis.pdf");
};

  const exportToDoc = () => {
    const content = `Multi-Perspective Analysis\n\n
Article Summary:\n${cleanText(summary)}\n\n
AI Perspective:\n${cleanText(perspective)}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article-analysis.txt';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    handleClose();
  };
  const isDisabled = !summary || !perspective;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleClick}
          size="small"
          disabled={isDisabled}
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
          Export as Text
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;
