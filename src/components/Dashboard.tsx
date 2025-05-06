'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import TimelineSlider from './TimelineSlider';
import SunCanvas from './SunCanvas';
import { sunEvents } from '../data/sunEvents';
import { Pause, PlayArrow,Autorenew  } from '@mui/icons-material';

type Ev = { date: string; lat: number; lon: number; sizeRad: number };

const Dashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [spinSun, setSpinSun] = useState(true);
  const [autoPlayDates, setAutoPlayDates] = useState(false);
  const [mounted, setMounted] = useState(false);

  // build distinct dates, sorted
  const dates = useMemo(() => {
    return Array.from(new Set((sunEvents as Ev[]).map(e => e.date))).sort();
  }, []);

  // group events by date
  const eventsByDate = useMemo(() => {
    return (sunEvents as Ev[]).reduce<Record<string, Ev[]>>((acc, ev) => {
      (acc[ev.date] ||= []).push(ev);
      return acc;
    }, {});
  }, []);

  // spots for the currently selected date
  const spotsToday = eventsByDate[dates[selectedDateIdx]] || [];

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <IconButton
        onClick={() => setSpinSun(s => !s)}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          bgcolor: 'rgba(0,0,0,0.5)',
          color: 'white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
        }}>
        {spinSun ? <Autorenew /> : <PlayArrow />}
      </IconButton>
      <SunCanvas canvasRef={canvasRef} events={spotsToday} spin={spinSun} />
      <TimelineSlider
        dates={dates}
        selectedDateIdx={selectedDateIdx}
        setSelectedDateIdx={setSelectedDateIdx}
        autoPlayDates={autoPlayDates}
        setAutoPlayDates={setAutoPlayDates}
      />
    </Box>
  );
};

export default Dashboard;
