import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({ loading, children, disabled, ...props }) => (
  <Button
    variant="contained"
    disabled={loading || disabled}
    {...props}
  >
    {loading ? <CircularProgress size={24} color="inherit" /> : children}
  </Button>
);

export default LoadingButton;
