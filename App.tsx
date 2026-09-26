import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import Home from './pages/Home';
import ApexLegends from './pages/ApexLegends';
import SquadAssembler from './pages/SquadAssembler';
import Admin from './pages/Admin';

import { CatalogProvider } from './contexts/CatalogContext';

const App: React.FC = () => {
  return (
    <Router>
      <CatalogProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apex" element={<ApexLegends />} />
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
