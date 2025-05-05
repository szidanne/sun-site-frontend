import { Box, Slider, Typography } from '@mui/material';

interface Props {
  selectedEvent: number;
  setSelectedEvent: (e: number) => void;
  events: Ev[];
}

const TimelineSlider: React.FC<Props> = ({
  selectedEvent,
  setSelectedEvent,
  events,
}) => {
  const marks = events.map((evt, i) => ({ value: i, label: evt.date }));
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '10%',
        right: '10%',
        bgcolor: 'rgba(0,0,0,0.5)',
        p: 2,
        borderRadius: 2,
      }}>
      <Typography variant="body2" color="white">
        Event Date: {events[selectedEvent].date}
      </Typography>
      <Slider
        value={selectedEvent}
        min={0}
        max={events.length - 1}
        step={1}
        marks={marks}
        onChange={(_, v) => setSelectedEvent(v)}
        sx={{ color: 'primary.main' }}
      />
    </Box>
  );
};

export default TimelineSlider;
