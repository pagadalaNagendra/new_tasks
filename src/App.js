// src/App.js
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ThreeDViewer from './components/ThreeDViewer';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);

  return (
    <div className="App">
      <h1>2D to 3D Water Flow Effect</h1>
      <ImageUploader onImageUpload={setImage} />
      {image && <ThreeDViewer image={image} />}
    </div>
  );
};

export default App;
