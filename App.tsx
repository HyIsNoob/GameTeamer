import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ApexLegends from './pages/ApexLegends';
import SquadAssembler from './pages/SquadAssembler';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apex" element={<ApexLegends />} />
        <Route path="/squads" element={<SquadAssembler />} />
      </Routes>
    </Router>
  );
};

export default App;
