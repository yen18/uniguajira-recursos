import React from 'react';
import { TextField, InputAdornment } from '@mui/material';

const FormTextField = ({ icon: Icon, adornmentPosition = 'start', ...props }) => {
  const adornment = Icon ? (
    <InputAdornment position={adornmentPosition}>
      <Icon color="action" />
    </InputAdornment>
  ) : null;
  return (
    <TextField
      fullWidth
      margin="normal"
      {...props}
      InputProps={{
        ...(props.InputProps || {}),
        ...(Icon && adornmentPosition === 'start' ? { startAdornment: adornment } : {}),
        ...(Icon && adornmentPosition === 'end' ? { endAdornment: adornment } : {}),
      }}
    />
  );
};

export default FormTextField;
