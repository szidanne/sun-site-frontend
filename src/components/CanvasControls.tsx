'use client';
import React from 'react';
import { Box, IconButton } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 16,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      background: 'rgba(0,0,0,0.3)',
      p: 1,
      borderRadius: 1,
    }}>
    <IconButton size="small" onClick={onZoomIn} color="inherit">
      <ZoomInIcon />
    </IconButton>
    <IconButton size="small" onClick={onZoomOut} color="inherit">
      <ZoomOutIcon />
    </IconButton>
    <IconButton size="small" onClick={onReset} color="inherit">
      <CenterFocusWeakIcon />
    </IconButton>
  </Box>
);

export default CanvasControls;
