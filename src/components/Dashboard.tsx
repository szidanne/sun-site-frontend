'use client';
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import TimelineSlider from './TimelineSlider';
import sunEvents from '../data/sunEvents.json';
import SunCanvas from './SunCanvas';

const Dashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <>
      <Box sx={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <SunCanvas
          canvasRef={canvasRef}
          events={sunEvents as Ev[]}
          selectedIdx={selectedEvent}
        />
        <TimelineSlider
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          events={sunEvents}
        />
      </Box>
    </>
  );
};

export default Dashboard;
