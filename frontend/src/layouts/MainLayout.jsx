import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
    IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, 
    Collapse, Avatar, Menu, MenuItem, Tooltip 
} from '@mui/material';
import { 
    Menu as MenuIcon, 
    ChevronLeft, 
    ExpandLess, 
    ExpandMore,
    LayoutDashboard,
    ChefHat,         // Produção
    ShoppingCart,    // Vendas/PDV
    Package,         // Almoxarifado/Estoque
    ShoppingBag,     // Compras
    Users,           // Clientes/Fornecedores
    CircleDollarSign,// Financeiro (Menu Pai)
    Landmark,        // Contas Bancárias
    History,         // Histórico/Extrato
    TrendingUp,      // Contas a Receber
    TrendingDown,    // Contas a Pagar
    Settings,
    LogOut,
    User
} from 'lucide-react';

const drawerWidth = 260;

export default function MainLayout() {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    
    // Estados para menus expansíveis (Collapses)
    const [financeiroOpen, setFinanceiroOpen] = useState(false);
    const [producaoOpen, setProducaoOpen] = useState(false);
    const [estoqueOpen, setEstoqueOpen] = useState(false);

    const location = useLocation();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Helper para verificar rota ativa
    const isActive = (path) => location.pathname === path;

    // Estilo para o ícone ativo
    const iconStyle = (path) => ({
        color: isActive(path) ? '#1976d2' : '#5f6368',
        minWidth: '40px'
    });

    const textStyle = (path) => ({
        '& span': { 
            fontWeight: isActive(path) ? 'bold' : 'normal',
            color: isActive(path) ? '#1976d2' : 'inherit'
        }
    });

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Top Bar */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ marginRight: 2 }}
                    >
                        {open ? <ChevronLeft /> : <MenuIcon />}
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Padaria ERP
                    </Typography>
                    
                    <Box>
                        <Tooltip title="Configurações de Conta">
                            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                                <Avatar alt="Admin User" src="/static/images/avatar/2.jpg" />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleMenuClose}>
                                <ListItemIcon><User size={18} /></ListItemIcon>
                                <Typography textAlign="center">Perfil</Typography>
                            </MenuItem>
                            <MenuItem onClick={handleMenuClose}>
                                <ListItemIcon><Settings size={18} /></ListItemIcon>
                                <Typography textAlign="center">Configurações</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleMenuClose}>
                                <ListItemIcon><LogOut size={18} color="red" /></ListItemIcon>
                                <Typography textAlign="center" color="error">Sair</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    width: open ? drawerWidth : 72,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: open ? drawerWidth : 72, 
                        boxSizing: 'border-box',
                        transition: 'width 0.3s',
                        overflowX: 'hidden'
                    },
                }}
            >
                <Toolbar /> {/* Espaçador para a AppBar */}
                <Box sx={{ overflow: 'auto', mt: 1 }}>
                    <List>
                        {/* Dashboard */}
                        <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/" sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                                <ListItemIcon sx={iconStyle('/')}>
                                    <LayoutDashboard />
                                </ListItemIcon>
                                <ListItemText primary="Dashboard" sx={{ opacity: open ? 1 : 0, ...textStyle('/') }} />
                            </ListItemButton>
                        </ListItem>

                        {/* PDV / Vendas */}
                        <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/pdv" sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                                <ListItemIcon sx={iconStyle('/pdv')}>
                                    <ShoppingCart />
                                </ListItemIcon>
                                <ListItemText primary="PDV / Vendas" sx={{ opacity: open ? 1 : 0, ...textStyle('/pdv') }} />
                            </ListItemButton>
                        </ListItem>

                        {/* Menu Produção */}
                        <ListItemButton onClick={() => setProducaoOpen(!producaoOpen)} sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                            <ListItemIcon sx={{ minWidth: '40px', color: '#5f6368' }}>
                                <ChefHat />
                            </ListItemIcon>
                            <ListItemText primary="Produção" sx={{ opacity: open ? 1 : 0 }} />
                            {open && (producaoOpen ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>
                        <Collapse in={producaoOpen && open} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItemButton component={Link} to="/producao/ordens" sx={{ pl: 4 }}>
                                    <ListItemText primary="Ordens de Produção" sx={textStyle('/producao/ordens')} />
                                </ListItemButton>
                                <ListItemButton component={Link} to="/producao/fichas" sx={{ pl: 4 }}>
                                    <ListItemText primary="Fichas Técnicas" sx={textStyle('/producao/fichas')} />
                                </ListItemButton>
                            </List>
                        </Collapse>

                        {/* Menu Almoxarifado & Compras */}
                        <ListItemButton onClick={() => setEstoqueOpen(!estoqueOpen)} sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                            <ListItemIcon sx={{ minWidth: '40px', color: '#5f6368' }}>
                                <Package />
                            </ListItemIcon>
                            <ListItemText primary="Estoque & Compras" sx={{ opacity: open ? 1 : 0 }} />
                            {open && (estoqueOpen ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>
                        <Collapse in={estoqueOpen && open} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItemButton component={Link} to="/produtos" sx={{ pl: 4 }}>
                                    <ListItemText primary="Produtos" sx={textStyle('/produtos')} />
                                </ListItemButton>
                                <ListItemButton component={Link} to="/almoxarifados" sx={{ pl: 4 }}>
                                    <ListItemText primary="Almoxarifados" sx={textStyle('/almoxarifados')} />
                                </ListItemButton>
                                <ListItemButton component={Link} to="/compras" sx={{ pl: 4 }}>
                                    <ListItemText primary="Compras (NFe)" sx={textStyle('/compras')} />
                                </ListItemButton>
                            </List>
                        </Collapse>

                        {/* ================================================= */}
                        {/* NOVO MENU FINANCEIRO */}
                        {/* ================================================= */}
                        <ListItemButton onClick={() => setFinanceiroOpen(!financeiroOpen)} sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                            <ListItemIcon sx={{ minWidth: '40px', color: '#5f6368' }}>
                                <CircleDollarSign />
                            </ListItemIcon>
                            <ListItemText primary="Financeiro" sx={{ opacity: open ? 1 : 0 }} />
                            {open && (financeiroOpen ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>
                        <Collapse in={financeiroOpen && open} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {/* Contas Bancárias (Nova Rota) */}
                                <ListItemButton component={Link} to="/financeiro/contas" sx={{ pl: 4 }}>
                                    <ListItemIcon sx={{ minWidth: '30px', color: isActive('/financeiro/contas') ? '#1976d2' : '#757575' }}>
                                        <Landmark size={20} />
                                    </ListItemIcon>
                                    <ListItemText primary="Contas Bancárias" sx={textStyle('/financeiro/contas')} />
                                </ListItemButton>

                                {/* Extrato Geral (Nova Rota) */}
                                <ListItemButton component={Link} to="/financeiro/historico" sx={{ pl: 4 }}>
                                    <ListItemIcon sx={{ minWidth: '30px', color: isActive('/financeiro/historico') ? '#1976d2' : '#757575' }}>
                                        <History size={20} />
                                    </ListItemIcon>
                                    <ListItemText primary="Extrato Geral" sx={textStyle('/financeiro/historico')} />
                                </ListItemButton>

                                {/* Links Antigos (Opcional - Mantenha se ainda usar) */}
                                <ListItemButton component={Link} to="/financeiro/contas-a-pagar" sx={{ pl: 4 }}>
                                    <ListItemIcon sx={{ minWidth: '30px' }}><TrendingDown size={20} /></ListItemIcon>
                                    <ListItemText primary="Contas a Pagar" sx={textStyle('/financeiro/contas-a-pagar')} />
                                </ListItemButton>
                                <ListItemButton component={Link} to="/financeiro/contas-a-receber" sx={{ pl: 4 }}>
                                    <ListItemIcon sx={{ minWidth: '30px' }}><TrendingUp size={20} /></ListItemIcon>
                                    <ListItemText primary="Contas a Receber" sx={textStyle('/financeiro/contas-a-receber')} />
                                </ListItemButton>
                            </List>
                        </Collapse>

                        <Divider sx={{ my: 1 }} />

                        {/* Cadastros Gerais */}
                        <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/clientes" sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                                <ListItemIcon sx={iconStyle('/clientes')}>
                                    <Users />
                                </ListItemIcon>
                                <ListItemText primary="Clientes" sx={{ opacity: open ? 1 : 0, ...textStyle('/clientes') }} />
                            </ListItemButton>
                        </ListItem>
                         <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/fornecedores" sx={{ justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                                <ListItemIcon sx={iconStyle('/fornecedores')}>
                                    <Users />
                                </ListItemIcon>
                                <ListItemText primary="Fornecedores" sx={{ opacity: open ? 1 : 0, ...textStyle('/fornecedores') }} />
                            </ListItemButton>
                        </ListItem>

                    </List>
                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${open ? drawerWidth : 72}px)` }}>
                <Toolbar /> {/* Espaçador para o conteúdo não ficar embaixo da AppBar */}
                <Outlet />
            </Box>
        </Box>
    );
}