import React from 'react';
import { Alert, Collapse, IconButton, Box } from '@mui/material';
import { Close, Refresh, CheckCircle, Error, HourglassEmpty } from '@mui/icons-material';

const ConnectionStatus = ({ status, onRetry }) => {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    setOpen(status !== 'connected');
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          severity: 'success',
          icon: <CheckCircle />,
          message: 'Conectado al servidor ✅',
          showRetry: false
        };
      case 'connecting':
        return {
          severity: 'info',
          icon: <HourglassEmpty />,
          message: 'Conectando al servidor...',
          showRetry: false
        };
      case 'disconnected':
      default:
        return {
          severity: 'error',
          icon: <Error />,
          message: 'Sin conexión al servidor. Asegúrese de que el backend esté ejecutándose en puerto 3001',
          showRetry: true
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'connected') {
    return null; // No mostrar nada si está conectado
  }

  return (
    <Collapse in={open}>
      <Alert
        severity={config.severity}
        icon={config.icon}
        action={
          <Box display="flex" alignItems="center">
            {config.showRetry && (
              <IconButton
                color="inherit"
                size="small"
                onClick={onRetry}
                sx={{ mr: 1 }}
              >
                <Refresh />
              </IconButton>
            )}
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setOpen(false)}
            >
              <Close fontSize="inherit" />
            </IconButton>
          </Box>
        }
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          borderRadius: 0,
          '& .MuiAlert-message': {
            fontSize: '0.875rem',
          }
        }}
      >
        {config.message}
      </Alert>
    </Collapse>
  );
};

export default ConnectionStatus;