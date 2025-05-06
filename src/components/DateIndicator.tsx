'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  date: string;
}

const DateIndicator: React.FC<Props> = ({ date }) => {
  // format: “April 4, 2025”
  const pretty = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box sx={{ color: 'white', px: 2 }}>
      <Typography variant="h6">{pretty}</Typography>
    </Box>
  );
};

export default DateIndicator;
