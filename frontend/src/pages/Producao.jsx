// src/pages/Producao.jsx
import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import FichasTecnicas from '../components/producao/FichasTecnicas';
import OrdensProducao from '../components/producao/OrdensProducao'; // 1. Importe o componente

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`producao-tabpanel-${index}`}
      aria-labelledby={`producao-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Producao() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Controle de Produção
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Abas de Produção">
          <Tab label="Ordens de Produção" id="producao-tab-0" />
          <Tab label="Fichas Técnicas" id="producao-tab-1" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <OrdensProducao /> {/* 2. Use o componente aqui */}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <FichasTecnicas />
      </TabPanel>
    </Box>
  );
}