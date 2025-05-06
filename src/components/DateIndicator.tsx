'use client';
import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

interface Props {
  date: string;
}

const DateIndicator: React.FC<Props> = ({ date }) => {
  const pretty = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        color: 'white',
        bgcolor: 'rgba(0,0,0,0.6)',
        p: 1,
        borderRadius: 1,
        position: 'absolute',
        bottom: 20 + 64, // above your slider
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
      <Typography variant="h6" sx={{ mr: 1, textAlign: 'center' }}>
        {pretty}
      </Typography>
      <Tooltip title="Data source: Helioviewer API v2">
        <IconButton size="small" sx={{ color: 'white' }}>
          <InfoOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default DateIndicator;
