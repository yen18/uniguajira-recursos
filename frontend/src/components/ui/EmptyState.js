import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyState = ({ title = 'Sin datos', description = 'No hay información disponible aún.' }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <Typography variant="body2" color="text.secondary">{description}</Typography>
  </Box>
);

export default EmptyState;
