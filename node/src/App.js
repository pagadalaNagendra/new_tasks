import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import HomePage from './components/HomePage';
import Vertical from './components/vertical';
import Parameter from './components/parameter';
import Node from './components/node';

import './styles.css';
import Platform from './components/platform';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/Node-Simultor" element={<HomePage />} />
          <Route path="/Node-Simultor/vertical" element={<Vertical />} />
          <Route path="/Node-Simultor/parameter" element={<Parameter />} />
          <Route path="/Node-Simultor/node" element={<Node />} />
          <Route path="/Node-Simultor/platform" element={<Platform />} />
          {/* Redirect any unknown paths to HomePage */}
          <Route path="*" element={<Navigate to="/Node-Simultor" />} />
        </Routes>
      </div>
    
    </Router>
  );
}

export default App;
