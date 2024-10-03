import React from 'react';

const Terminala = ({ data }) => {
  return (
    <div className="terminal">
      <h3>Terminal Output</h3>
      {data && typeof data === 'object' ? (
        <pre>{JSON.stringify(data, null, 2)}</pre> // Render JSON string
      ) : (
        <p>No data available</p> // Fallback for empty or invalid data
      )}
    </div>
  );
};

export default Terminala;
