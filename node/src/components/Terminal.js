// Terminal.js
import React from 'react';
import './Terminal.css'; // Adjust styles as needed

const Terminal = ({ data }) => {
  return (
    <div className="terminal">
      <h2>Terminal Output</h2>
      <pre>{data}</pre>
    </div>
  );
};

export default Terminal;


