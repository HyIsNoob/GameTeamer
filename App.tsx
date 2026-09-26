import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import Home from './pages/Home';
import ApexLegends from './pages/ApexLegends';
import SquadAssembler from './pages/SquadAssembler';
import Admin from './pages/Admin';
import Valorant from './pages/Valorant';
import Tournament from './pages/Tournament';

import { CatalogProvider } from './contexts/CatalogContext';

const App: React.FC = () => {
  return (
    <Router>
      <CatalogProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apex" element={<ApexLegends />} />
          <Route path="/valorant" element={<Valorant />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/custom" element={<Tournament />} />
          <Route path="/squads" element={<SquadAssembler />} />
          <Route path="/admin" element={<Admin />} />
          {/* Redirect unknown routes to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </CatalogProvider>
    </Router>
  );
};

export default App;
