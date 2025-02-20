import 'raf/polyfill';
import React, { Component } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './components/Home';
import GamePage from './components/GamePage';
import InformationPage from './components/InformationPage';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <nav className="top-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/information" className="nav-link">Information</Link>
            <Link to="/game" className="nav-link">Start Game</Link>
          </nav>
          <Routes>
            <Route path="/game" element={<GamePage />} />
            <Route path="/information" element={<InformationPage />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Router>
    );
  }
}

export default App;