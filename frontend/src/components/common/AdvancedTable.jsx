// src/components/common/AdvancedTable.jsx
import React from 'react';
import { DataGrid, ptBR } from '@mui/x-data-grid';
import { Paper } from '@mui/material';

export default function AdvancedTable({
    rows,
    columns,
    loading = false,
    ...props
}) {
  const defaultColumnOptions = {
    resizable: true,
    sortable: true,
  };

  // Aplica as opções padrão a cada coluna
  const enhancedColumns = columns.map(col => ({
    ...defaultColumnOptions,
    ...col
  }));

  return (
    <Paper
      elevation={2}
      sx={{
        height: 'auto', // Ajusta a altura ao conteúdo
        width: '100%',
        '& .MuiDataGrid-root': {
            border: 'none', // Remove a borda padrão
        },
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.default', // Cor de fundo do cabeçalho
            fontWeight: 'bold'
        },
        '& .MuiDataGrid-cell': {
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`, // Linha divisória
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={enhancedColumns}
        loading={loading}
        // ===========================================
        // FUNCIONALIDADES ADICIONADAS
        // ===========================================
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick // Desabilita a seleção de linha ao clicar
        autoHeight // A tabela se ajusta à altura do conteúdo
        localeText={ptBR.components.MuiDataGrid.defaultProps.localeText} // Tradução
        {...props}
      />
    </Paper>
  );
}
