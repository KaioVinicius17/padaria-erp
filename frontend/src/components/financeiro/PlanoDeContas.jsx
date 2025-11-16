// src/components/financeiro/PlanoDeContas.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export default function PlanoDeContas() {
  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
        Gerenciar Plano de Contas
      </Typography>
      <Typography>
        Esta seção está em desenvolvimento. Aqui você poderá cadastrar, editar e visualizar todas as categorias de receitas e despesas da sua empresa.
      </Typography>
    </Box>
  );
}