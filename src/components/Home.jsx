import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import logo from '../assets/logo.svg';

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <img src={logo} className="home-logo" alt="logo" />
        <h1>Welcome to React Poker</h1>
      </header>
      <nav className="home-nav">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/information" className="nav-link">Information</Link>
        <Link to="/game" className="nav-link">Start Game</Link>
      </nav>
    </div>
  );
};

export default Home;