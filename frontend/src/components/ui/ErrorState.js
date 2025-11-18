import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';

const ErrorState = ({ message, code, onRetry }) => (
  <Box sx={{ my: 2 }}>
    <Alert severity="error" sx={{ mb: 1 }}>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
      {code && (
        <Typography variant="caption" component="div" sx={{ opacity: 0.8 }}>
          Código: {code}
        </Typography>
      )}
    </Alert>
    {onRetry && (
      <Button size="small" onClick={onRetry} variant="outlined">
        Reintentar
      </Button>
    )}
  </Box>
);

export default ErrorState;
