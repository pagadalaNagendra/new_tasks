// src/components/ThreeDViewer.js
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import * as THREE from 'three';

// Extend the ShaderMaterial so it can be used declaratively
class CustomShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        u_time: { value: 0.0 },
        u_flowRate: { value: 0.0 },
        u_texture: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform float u_flowRate;
        uniform sampler2D u_texture;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          uv.y += sin(uv.x * 10.0 + u_time * 2.0) * 0.1 * u_flowRate;
          gl_FragColor = texture2D(u_texture, uv);
        }
      `,
    });
  }
}

extend({ CustomShaderMaterial });

const Plane = ({ image, flowRate }) => {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      materialRef.current.uniforms.u_flowRate.value = flowRate;
    }
  });

  const texture = useLoader(TextureLoader, image);

  return (
    <mesh>
      <planeGeometry args={[5, 3]} />
      <customShaderMaterial ref={materialRef} uniforms-u_texture-value={texture} />
    </mesh>
  );
};

const ThreeDViewer = ({ image }) => {
  const [flowRate, setFlowRate] = useState(1.0);

  useEffect(() => {
    const fetchFlowRate = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/water-flow');
        const data = await response.json();
        setFlowRate(data.flowRate);
      } catch (error) {
        console.error('Error fetching water flow data:', error);
      }
    };

    fetchFlowRate();
    const interval = setInterval(fetchFlowRate, 5000); // Fetch new data every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Plane image={image} flowRate={flowRate} />
    </Canvas>
  );
};

export default ThreeDViewer;
