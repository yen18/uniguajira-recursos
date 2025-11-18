import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Button } from '@mui/material';

const DemoCredentialsModal = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} aria-labelledby="demo-cred-title">
    <DialogTitle id="demo-cred-title">Credenciales de Prueba</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" gutterBottom>
        Estas credenciales existen solo para validar el flujo en entorno de pruebas. No utilizarlas en producción.
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" display="block"><strong>Estudiante:</strong> yenerf18@gmail.com / 1</Typography>
        <Typography variant="caption" display="block"><strong>Profesor:</strong> vv / 2</Typography>
        <Typography variant="caption" display="block"><strong>Admin:</strong> hh / 3</Typography>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cerrar</Button>
    </DialogActions>
  </Dialog>
);

export default DemoCredentialsModal;
