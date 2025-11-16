import React from 'react';
import PropTypes from 'prop-types';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    IconButton, 
    Tooltip 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function FichaTecnicaList({ fichas, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Produto Final</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fichas.map((ficha) => (
            <TableRow hover key={ficha.id}>
              <TableCell component="th" scope="row">{ficha.produto_final_nome}</TableCell>
              <TableCell>{ficha.descricao}</TableCell>
              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton onClick={() => onEdit(ficha)} color="primary"><EditIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton onClick={() => onDelete(ficha.id)} color="error"><DeleteIcon /></IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

FichaTecnicaList.propTypes = {
  fichas: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
