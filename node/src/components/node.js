import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // Import SweetAlert
import './node.css';
import config from '../config';

const FormPage3 = () => {
  const [verticals, setVerticals] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedVertical, setSelectedVertical] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('https'); // Default value
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedParameter, setSelectedParameter] = useState([]);
  const [nodeId, setNodeId] = useState('');
  const [frequency, setFrequency] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const platforms = [
    { name: "ccsp" },
    { name: "OneM2m" }
  ];

  useEffect(() => {
    axios.get(`${config.backendAPI}/verticals/`)
      .then(response => {
        setVerticals(response.data);
      })
      .catch(error => {
        console.error('Error fetching verticals!', error);
      });
  }, []);

  const handleVerticalChange = (e) => {
    const selectedVerticalName = e.target.value;
    setSelectedVertical(selectedVerticalName);

    const selectedVerticalObject = verticals.find(vertical => vertical.name === selectedVerticalName);
    if (selectedVerticalObject) {
      axios.get(`${config.backendAPI}/parameters/?vertical_id=${selectedVerticalObject.id}`)
        .then(response => {
          setParameters(response.data);
          setSelectedParameter([]); // Clear previous selections
        })
        .catch(error => {
          console.error('Error fetching parameters!', error);
        });
    } else {
      setParameters([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedVerticalObject = verticals.find(vertical => vertical.name === selectedVertical);

    const formData = {
      node_id: nodeId.toUpperCase(),
      platform: selectedPlatform,
      protocol: selectedProtocol,
      frequency: (frequency.hours * 3600) + (frequency.minutes * 60) + frequency.seconds,
      parameter_id: JSON.stringify(selectedParameter),
      services: "stop",
      vertical_id: selectedVerticalObject ? selectedVerticalObject.id : 0,
    };

    axios.post(`${config.backendAPI}/nodes/`, formData)
      .then(response => {
        // Show success alert
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Form submitted successfully!',
          confirmButtonText: 'OK'
        }).then(() => {
          // Auto-refresh page after clicking OK
          window.location.reload();
        });
        console.log('Form submitted successfully:', response.data);
      })
      .catch(error => {
        console.error('Error submitting form!', error);

        // Show error alert
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong! Please try again.',
          confirmButtonText: 'OK'
        });
      });
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2>Node</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vertical_name">Vertical Name:</label>
            <select id="vertical_name" name="vertical_name" onChange={handleVerticalChange}>
              <option value="">Select Vertical</option>
              {verticals.map(vertical => (
                <option key={vertical.id} value={vertical.name}>
                  {vertical.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="node_id">Node ID:</label>
            <input 
              type="text" 
              id="node_id" 
              name="node_id" 
              value={nodeId}
              onChange={e => setNodeId(e.target.value.toUpperCase())} // Convert input to uppercase
            />
          </div>

          <div className="form-group">
            <label htmlFor="protocol">Protocol:</label>
            <select id="protocol" name="protocol" value={selectedProtocol} onChange={e => setSelectedProtocol(e.target.value)}>
              <option value="">Select Protocol</option>
              {["http", "https"].map((protocol, index) => (
                <option key={index} value={protocol}>
                  {protocol}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="platform">Platform:</label>
            <select id="platform" name="platform" onChange={e => setSelectedPlatform(e.target.value)}>
              <option value="">Select Platform</option>
              {platforms.map((platform, index) => (
                <option key={index} value={platform.name}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          {selectedVertical && parameters.length > 0 && (
            <div className="form-group">
              <label htmlFor="parameter">Parameter:</label>
              <div className="parameter-grid">
                {parameters.map(parameter => (
                  <div key={parameter.id} className="parameter-item">
                    <input 
                      type="checkbox" 
                      id={`parameter_${parameter.id}`} 
                      value={parameter.id} 
                      onChange={e => setSelectedParameter(prev => 
                        prev.includes(parameter.id) 
                          ? prev.filter(id => id !== parameter.id) 
                          : [...prev, parameter.id]
                      )}
                      checked={selectedParameter.includes(parameter.id)} 
                    />
                    <label htmlFor={`parameter_${parameter.id}`}>{parameter.name}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Frequency:</label>
            <div className="flex-container">
              <input 
                type="number" 
                name="hours" 
                placeholder="Hours" 
                min="0" 
                max="24" 
                onChange={e => setFrequency({ ...frequency, hours: e.target.value })} 
              />
              <input 
                type="number" 
                name="minutes" 
                placeholder="Minutes" 
                min="0" 
                max="60" 
                onChange={e => setFrequency({ ...frequency, minutes: e.target.value })} 
              />
              <input 
                type="number" 
                name="seconds" 
                placeholder="Seconds" 
                min="0" 
                max="60" 
                onChange={e => setFrequency({ ...frequency, seconds: e.target.value })} 
              />
            </div>
          </div>

          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default FormPage3;
