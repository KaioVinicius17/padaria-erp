// src/layouts/MainLayout.jsx
// (ATUALIZADO: Removida "Posição de Estoque")

import React, { useState, useContext } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
    Box, Drawer, AppBar, Toolbar, List, Typography, ListItem, 
    ListItemButton, ListItemIcon, ListItemText, IconButton, Collapse, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../App';

import { 
    LayoutDashboard, Package, Users, Building, ShoppingCart, Warehouse, 
    ChefHat, Landmark, HandCoins, ScrollText, BookCheck, ChevronDown, ChevronUp,
    Sun, Moon,
    ArrowRightLeft, FileText, ClipboardCheck,
    Store, 
    Laptop,
    LayoutGrid
} from 'lucide-react';

const drawerWidth = 240;

const MainLayout = () => {
  const location = useLocation();
  const [openFinanceiro, setOpenFinanceiro] = useState(location.pathname.startsWith('/financeiro'));
  const [openEstoque, setOpenEstoque] = useState(location.pathname.startsWith('/estoque') || location.pathname === '/categorias');

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { text: 'PDV', icon: <Store size={20} />, path: '/pdv' },
    { text: 'Terminal Balcão', icon: <Laptop size={20} />, path: '/terminal-balcao' },
    { text: 'Clientes', icon: <Users size={20} />, path: '/clientes' },
    { text: 'Fornecedores', icon: <Building size={20} />, path: '/fornecedores' },
    { text: 'Produção', icon: <ChefHat size={20} />, path: '/producao' },
  ];
  
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const handleFinanceiroClick = () => {
    setOpenFinanceiro(!openFinanceiro);
  };

  const handleEstoqueClick = () => {
    setOpenEstoque(!openEstoque);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Plataforma de Gestão
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Divider />
        <Box sx={{ overflow: 'auto', p: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                    component={NavLink} 
                    to={item.path} 
                    end={item.path === '/'}
                    sx={{
                        borderRadius: '8px',
                        '&.active': {
                            backgroundColor: 'action.selected',
                            fontWeight: 'bold',
                        }
                    }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* MENU-PAI: ESTOQUE (Sem Posição) */}
            <ListItemButton onClick={handleEstoqueClick}>
              <ListItemIcon><Warehouse size={20} /></ListItemIcon>
              <ListItemText primary="Estoque" />
              {openEstoque ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </ListItemButton>
            <Collapse in={openEstoque} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                
                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/produtos">
                  <ListItemIcon><Package size={20} /></ListItemIcon>
                  <ListItemText primary="Produtos" />
                </ListItemButton>

                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/categorias">
                  <ListItemIcon><LayoutGrid size={20} /></ListItemIcon>
                  <ListItemText primary="Categorias" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/almoxarifados">
                  <ListItemIcon><Warehouse size={20} /></ListItemIcon>
                  <ListItemText primary="Almoxarifados" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/transferencias">
                  <ListItemIcon><ArrowRightLeft size={20} /></ListItemIcon>
                  <ListItemText primary="Transferências" />
                </ListItemButton>

                <Divider sx={{ my: 1, mx: 2 }} />

                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/requisicoes">
                  <ListItemIcon><FileText size={20} /></ListItemIcon>
                  <ListItemText primary="Requisições" />
                </ListItemButton>

                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/pedidos">
                  <ListItemIcon><ClipboardCheck size={20} /></ListItemIcon>
                  <ListItemText primary="Pedidos de Compra" />
                </ListItemButton>

                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/estoque/compras">
                  <ListItemIcon><ShoppingCart size={20} /></ListItemIcon>
                  <ListItemText primary="Entrada (Compras)" />
                </ListItemButton>

              </List>
            </Collapse>
            
            {/* Menu-Pai: FINANCEIRO */}
            <ListItemButton onClick={handleFinanceiroClick}>
              <ListItemIcon><Landmark size={20} /></ListItemIcon>
              <ListItemText primary="Financeiro" />
              {openFinanceiro ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </ListItemButton>
            <Collapse in={openFinanceiro} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/financeiro/contas-a-pagar">
                  <ListItemIcon><ScrollText size={20} /></ListItemIcon>
                  <ListItemText primary="Contas a Pagar" />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/financeiro/contas-a-receber">
                  <ListItemIcon><HandCoins size={20} /></ListItemIcon>
                  <ListItemText primary="Contas a Receber" />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }} component={NavLink} to="/financeiro/plano-de-contas">
                  <ListItemIcon><BookCheck size={20} /></ListItemIcon>
                  <ListItemText primary="Plano de Contas" />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;