// src/components/common/IconSelector.jsx
// (ATUALIZADO: Lista limpa de duplicatas e busca otimizada)

import React, { useState, useMemo } from 'react';
import { 
  Box, TextField, Grid, IconButton, Typography, 
  Pagination, Dialog, DialogTitle, DialogContent, InputAdornment, Button
} from '@mui/material';
import { Search, Package, X } from 'lucide-react'; 
import * as LucideIcons from 'lucide-react';

// --- 1. FILTRO AVANÇADO PARA REMOVER DUPLICATAS ---
// Pegamos todas as chaves, filtramos apenas as que começam com letra maiúscula (Componentes)
// e removemos palavras reservadas ou aliases conhecidos que não são ícones visuais.
const iconNamesRaw = Object.keys(LucideIcons);
const validIconNames = iconNamesRaw.filter(name => 
  /^[A-Z]/.test(name) && // Deve começar com maiúscula (Componente React)
  name !== 'createLucideIcon' && // Remove a função factory
  name !== 'Icon' // Remove o componente genérico
);

// Remove duplicatas reais (caso a biblioteca exporte alias) usando Set
const uniqueIconNames = [...new Set(validIconNames)].sort();

export default function IconSelector({ selectedIcon, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const iconsPerPage = 48;

  // Filtra os ícones baseado na busca
  const filteredIcons = useMemo(() => {
    if (!search) return uniqueIconNames;
    return uniqueIconNames.filter(name => 
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Paginação
  const pageCount = Math.ceil(filteredIcons.length / iconsPerPage);
  const displayedIcons = filteredIcons.slice(
    (page - 1) * iconsPerPage, 
    page * iconsPerPage
  );

  const handleSelect = (name) => {
    onSelect(name);
    setOpen(false);
  };

  // Ícone selecionado (com fallback seguro)
  const SelectedIconComponent = (selectedIcon && LucideIcons[selectedIcon]) 
    ? LucideIcons[selectedIcon] 
    : Package; 

  return (
    <>
      {/* Botão de Seleção */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box 
          sx={{ 
            border: '1px solid', borderColor: 'divider', borderRadius: 2,
            width: 56, height: 56, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            bgcolor: 'action.hover', color: 'primary.main',
            boxShadow: 1
          }}
        >
          <SelectedIconComponent size={28} />
        </Box>
        <Box>
            <Typography variant="caption" display="block" color="text.secondary">
                Ícone da Categoria
            </Typography>
            <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
                {selectedIcon ? 'Alterar Ícone' : 'Selecionar Ícone'}
            </Button>
        </Box>
      </Box>

      {/* Modal de Ícones */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Biblioteca de Ícones
            <IconButton onClick={() => setOpen(false)}><X size={20} /></IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <TextField
            fullWidth
            placeholder="Pesquisar ícone (inglês)... Ex: cart, food, user"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ mb: 3 }}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>
            }}
          />

          <Box sx={{ minHeight: 350 }}>
            {displayedIcons.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Nenhum ícone encontrado.</Typography>
                </Box>
            ) : (
                <Grid container spacing={1}>
                {displayedIcons.map((name) => {
                    const Icon = LucideIcons[name];
                    if (!Icon) return null;

                    return (
                    <Grid item key={name}>
                        <IconButton 
                            onClick={() => handleSelect(name)}
                            title={name}
                            sx={{ 
                                border: selectedIcon === name ? '2px solid' : '1px solid',
                                borderColor: selectedIcon === name ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                width: 48, height: 48,
                                color: selectedIcon === name ? 'primary.main' : 'text.primary',
                                bgcolor: selectedIcon === name ? 'primary.light' : 'transparent',
                                '&:hover': { bgcolor: 'action.hover', borderColor: 'text.primary' }
                            }}
                        >
                            <Icon size={24} />
                        </IconButton>
                    </Grid>
                    );
                })}
                </Grid>
            )}
          </Box>

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={pageCount} 
                page={page} 
                onChange={(e, v) => setPage(v)} 
                color="primary"
                showFirstButton showLastButton
                siblingCount={0}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}