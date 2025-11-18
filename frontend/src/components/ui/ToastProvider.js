import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext({ show: () => {}, showSuccess: () => {}, showError: () => {}, showInfo: () => {} });

export const ToastProvider = ({ children, autoHideDuration = 4000 }) => {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, severity = 'info') => {
    setToast({ message, severity, open: true });
  }, []);

  const showSuccess = useCallback((message) => show(message, 'success'), [show]);
  const showError = useCallback((message) => show(message, 'error'), [show]);
  const showInfo = useCallback((message) => show(message, 'info'), [show]);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((t) => t ? { ...t, open: false } : null);
  };

  return (
    <ToastContext.Provider value={{ show, showSuccess, showError, showInfo }}>
      {children}
      <Snackbar
        open={Boolean(toast?.open)}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast?.severity || 'info'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
