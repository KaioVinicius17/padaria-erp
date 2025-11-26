// src/layouts/MainLayout.jsx
// (ATUALIZADO: Menu Responsivo - Mini/Expansível no Desktop + Hamburger no Mobile)

import React, { useState, useContext, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
    Box, Toolbar, List, Typography, ListItem, 
    ListItemButton, ListItemIcon, ListItemText, IconButton, Collapse, Divider,
    AppBar as MuiAppBar, Drawer as MuiDrawer, useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../App';

import { 
    LayoutDashboard, Package, Users, Building, ShoppingCart, Warehouse, 
    ChefHat, Landmark, HandCoins, ScrollText, BookCheck, ChevronDown, ChevronUp,
    Sun, Moon, ArrowRightLeft, FileText, ClipboardCheck, Store, Laptop, LayoutGrid, Boxes,
    Menu as MenuIcon, ChevronLeft, ChevronRight
} from 'lucide-react';

const drawerWidth = 260; // Largura do menu aberto

// --- MIXINS PARA TRANSIÇÕES CSS (Animação de abrir/fechar) ---
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`, // Largura quando fechado (só ícones)
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// --- COMPONENTES ESTILIZADOS ---
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', // Espaço entre título e botão de fechar
  padding: theme.spacing(0, 1),
  // Necessário para o conteúdo ficar abaixo da AppBar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// O Drawer Desktop (Permanente com variação de largura)
const DesktopDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const MainLayout = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const location = useLocation();
  
  // Detecta se é mobile (tela pequena)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados de controle dos Menus (Pai)
  const [openFinanceiro, setOpenFinanceiro] = useState(false);
  const [openEstoque, setOpenEstoque] = useState(false);

  // Estado do Menu Lateral (Aberto/Fechado)
  const [open, setOpen] = useState(true); // Desktop começa aberto
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile começa fechado

  // Efeito para abrir os submenus corretos ao carregar a página
  useEffect(() => {
    if (location.pathname.startsWith('/financeiro')) setOpenFinanceiro(true);
    if (location.pathname.startsWith('/estoque') || location.pathname === '/categorias') setOpenEstoque(true);
    
    // No mobile, fecha o menu ao navegar
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  // --- HANDLERS ---

  // Alterna o menu lateral (Desktop ou Mobile)
  const handleDrawerToggle = () => {
    if (isMobile) {
        setMobileOpen(!mobileOpen);
    } else {
        setOpen(!open);
    }
  };

  // Lógica inteligente para menus-pai (Estoque/Financeiro)
  // Se o menu estiver "minimizado", ele abre primeiro, depois expande o submenu
  const handleParentMenuClick = (menuState, setMenuState) => {
    if (!open && !isMobile) {
        setOpen(true); // Abre a lateral
        setTimeout(() => setMenuState(true), 200); // Abre o submenu com leve delay
    } else {
        setMenuState(!menuState); // Apenas alterna o submenu
    }
  };

  // --- LISTA DE ITENS DO MENU (Renderização) ---
  const drawerContent = (
    <List sx={{ px: 1 }}>
        
        {/* Itens Raiz */}
        {[
            { text: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/' },
            { text: 'PDV', icon: <Store size={22} />, path: '/pdv' },
            { text: 'Terminal Balcão', icon: <Laptop size={22} />, path: '/terminal-balcao' },
            { text: 'Clientes', icon: <Users size={22} />, path: '/clientes' },
            { text: 'Fornecedores', icon: <Building size={22} />, path: '/fornecedores' },
            { text: 'Produção', icon: <ChefHat size={22} />, path: '/producao' },
        ].map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <ListItemButton
                    component={NavLink}
                    to={item.path}
                    end={item.path === '/'}
                    sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center', // Centraliza ícone se fechado
                        px: 2.5,
                        borderRadius: '8px',
                        '&.active': { backgroundColor: 'action.selected', fontWeight: 'bold' }
                    }}
                    title={!open ? item.text : ""} // Tooltip nativo se fechado
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                        {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
            </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Menu ESTOQUE */}
        <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                onClick={() => handleParentMenuClick(openEstoque, setOpenEstoque)}
                sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, borderRadius: '8px' }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                    <Warehouse size={22} />
                </ListItemIcon>
                <ListItemText primary="Estoque" sx={{ opacity: open ? 1 : 0 }} />
                {open && (openEstoque ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
            </ListItemButton>
            
            <Collapse in={open && openEstoque} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {[
                        { text: 'Posição de Estoque', icon: <Boxes size={20} />, path: '/estoque/posicao' },
                        { text: 'Produtos', icon: <Package size={20} />, path: '/estoque/produtos' },
                        { text: 'Categorias', icon: <LayoutGrid size={20} />, path: '/estoque/categorias' },
                        { text: 'Almoxarifados', icon: <Warehouse size={20} />, path: '/estoque/almoxarifados' },
                        { text: 'Transferências', icon: <ArrowRightLeft size={20} />, path: '/estoque/transferencias' },
                        { text: 'Requisições', icon: <FileText size={20} />, path: '/estoque/requisicoes' },
                        { text: 'Pedidos de Compra', icon: <ClipboardCheck size={20} />, path: '/estoque/pedidos' },
                        { text: 'Entrada (Compras)', icon: <ShoppingCart size={20} />, path: '/estoque/compras' },
                    ].map((subItem) => (
                        <ListItemButton 
                            key={subItem.text}
                            component={NavLink} 
                            to={subItem.path}
                            sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }}
                        >
                            <ListItemIcon>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} />
                        </ListItemButton>
                    ))}
                </List>
            </Collapse>
        </ListItem>

        {/* Menu FINANCEIRO */}
        <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                onClick={() => handleParentMenuClick(openFinanceiro, setOpenFinanceiro)}
                sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, borderRadius: '8px' }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                    <Landmark size={22} />
                </ListItemIcon>
                <ListItemText primary="Financeiro" sx={{ opacity: open ? 1 : 0 }} />
                {open && (openFinanceiro ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
            </ListItemButton>
            
            <Collapse in={open && openFinanceiro} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {[
                        { text: 'Contas a Pagar', icon: <ScrollText size={20} />, path: '/financeiro/contas-a-pagar' },
                        { text: 'Contas a Receber', icon: <HandCoins size={20} />, path: '/financeiro/contas-a-receber' },
                        { text: 'Plano de Contas', icon: <BookCheck size={20} />, path: '/financeiro/plano-de-contas' },
                    ].map((subItem) => (
                        <ListItemButton 
                            key={subItem.text}
                            component={NavLink} 
                            to={subItem.path}
                            sx={{ pl: 4, borderRadius: '8px', '&.active': { backgroundColor: 'action.selected' } }}
                        >
                            <ListItemIcon>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} />
                        </ListItemButton>
                    ))}
                </List>
            </Collapse>
        </ListItem>

    </List>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      
      {/* --- APP BAR (Topo) --- */}
      <AppBar position="fixed" open={!isMobile && open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ marginRight: 5 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Plataforma de Gestão
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* --- MENU LATERAL (DRAWER) --- */}
      
      {/* Versão Mobile (Temporary) */}
      {isMobile ? (
          <MuiDrawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }} // Melhor desempenho no mobile
            sx={{
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <DrawerHeader>
                 <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>Menu</Typography>
                 <IconButton onClick={handleDrawerToggle}><ChevronLeft /></IconButton>
            </DrawerHeader>
            <Divider />
            {drawerContent}
          </MuiDrawer>
      ) : (
      /* Versão Desktop (Permanent Mini/Full) */
          <DesktopDrawer variant="permanent" open={open}>
            <DrawerHeader>
                {/* Só mostra o título se estiver aberto */}
                {open && <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold', flexGrow: 1 }}>Menu</Typography>}
                <IconButton onClick={handleDrawerToggle}>
                    {theme.direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
                </IconButton>
            </DrawerHeader>
            <Divider />
            {drawerContent}
          </DesktopDrawer>
      )}

      {/* --- CONTEÚDO PRINCIPAL DA PÁGINA --- */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%', overflowX: 'hidden' }}>
        <DrawerHeader /> {/* Espaçador para não ficar atrás da AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;