import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const OfflineBanner = () => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <Box role="alert" aria-live="assertive" sx={{ bgcolor: 'warning.dark', color: 'warning.contrastText', py: 0.75, textAlign: 'center' }}>
      <Typography variant="caption" fontWeight={500}>Sin conexión. Algunos datos pueden no estar actualizados.</Typography>
    </Box>
  );
};

export default OfflineBanner;
