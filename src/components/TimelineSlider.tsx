'use client';
import React, { useEffect } from 'react';
import { Box, Slider, IconButton } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import DateIndicator from './DateIndicator';

interface Props {
  dates: string[];
  selectedDateIdx: number;
  setSelectedDateIdx: React.Dispatch<React.SetStateAction<number>>;
  autoPlayDates: boolean;
  setAutoPlayDates: React.Dispatch<React.SetStateAction<boolean>>;
}

const TimelineSlider: React.FC<Props> = ({
  dates,
  selectedDateIdx,
  setSelectedDateIdx,
  autoPlayDates,
  setAutoPlayDates,
}) => {
  // if autoPlay is on, step every 1.5s
  useEffect(() => {
    if (!autoPlayDates) return;
    const iv = setInterval(() => {
      setSelectedDateIdx(i => (i + 1) % dates.length);
    }, 1500);
    return () => clearInterval(iv);
  }, [autoPlayDates, dates.length, setSelectedDateIdx]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '5%',
        right: '5%',
        bgcolor: 'rgba(0,0,0,0.6)',
        p: 2,
        borderRadius: 2,
        display: 'flex',
        gap: 2,
      }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <DateIndicator date={dates[selectedDateIdx]} />
      </Box>
      <Slider
        value={selectedDateIdx}
        min={0}
        max={dates.length - 1}
        step={1}
        marks={dates.map((d, i) => ({ value: i }))}
        onChange={(_, v) => setSelectedDateIdx(v as number)}
        sx={{
          color: 'primary.main',
          '.MuiSlider-mark': { display: 'none' }, // hide little tick marks
        }}
      />
      <IconButton
        size="small"
        onClick={() => setAutoPlayDates(v => !v)}
        sx={{
          color: 'white',
          bgcolor: 'rgba(255,255,255,0.1)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
        }}>
        {autoPlayDates ? <Pause /> : <PlayArrow />}
      </IconButton>
    </Box>
  );
};

export default TimelineSlider;
