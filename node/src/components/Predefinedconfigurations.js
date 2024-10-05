import React, { useState, useEffect } from "react";
import "./platform.css";
import config from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import Terminal from "./Terminal"; // Import the Terminal component
import Status from "./statustable";
import "./Predefinedconfigurations.css";
const DataTable = ({ data, isRunning }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Node ID</th>
        <th>Services</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item) => (
        <tr key={item.node_id}>
          <td>{item.node_id}</td>
          <td>
            <span className={`status-indicator ${isRunning ? "status-start" : "status-stop"}`}></span>
            {item.services}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const PredefinedConfigurations = () => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [platformData, setPlatformData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [fetchedData, setFetchedData] = useState([]);

  // Fetch unique platforms
  useEffect(() => {
    fetch(`${config.backendAPI}/nodes`)
      .then((response) => response.json())
      .then((data) => {
        const uniquePlatforms = Array.from(new Set(data.map((node) => node.platform))).filter(Boolean);
        setPlatforms(uniquePlatforms);
        if (uniquePlatforms.includes("ccsp")) {
          setSelectedPlatform("ccsp");
        }
      })
      .catch((error) => console.error("Error fetching nodes:", error));
  }, []);

  // Fetch platform data based on selected platform
  useEffect(() => {
    if (selectedPlatform) {
      fetch(`${config.backendAPI}/nodes`)
        .then((response) => response.json())
        .then((data) => {
          const filteredData = data.filter((node) => node.platform === selectedPlatform);
          const nodesWithParams = Promise.all(
            filteredData.map(async (node) => {
              const paramResponse = await fetch(`${config.backendAPI}/nodes/all/${node.node_id}`);
              const paramData = await paramResponse.json();
              return { ...node, parameters: paramData.parameters || [] };
            })
          );

          nodesWithParams.then(setPlatformData).catch((error) => console.error("Error fetching node parameters:", error));
        })
        .catch((error) => console.error("Error fetching platform data:", error));
    } else {
      setPlatformData([]);
    }
  }, [selectedPlatform]);

  // Fetch data from the URL for the DataTable
  useEffect(() => {
    fetch(`${config.backendAPI}/nodes/`)
      .then((response) => response.json())
      .then((data) => {
        setFetchedData(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handlePlatformSelect = (event) => {
    const platform = event.target.value;
    setSelectedPlatform(platform);
  };

  const handleStartStopToggle = () => {
    setIsRunning(!isRunning);

    const selectedNodesData = platformData.map((node) => ({ node_id: node.node_id }));

    if (!isRunning) {
      const startData = platformData.map((node) => ({
        node_id: node.node_id,
        frequency: node.frequency,
        parameters:
          node.parameters.map((param) => ({
            name: param.name,
            min: param.min_value,
            max: param.max_value,
          })) || [],
        platform: node.platform,
        protocol: node.protocol,
      }));

      console.log("Starting services with data:", startData); // Log request data
      fetch(`http://127.0.0.1:8000/services/start`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(startData),
      })
        .then((response) => {
          console.log("Start response status:", response.status); // Log response status
          return response.json();
        })
        .then((data) => {
          console.log("Start response data:", data); // Log response data
        })
        .catch((error) => console.error("Error starting services:", error));
    } else {
      console.log("Stopping services for nodes:", selectedNodesData); // Log request data
      fetch(`http://127.0.0.1:8000/services/stop`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedNodesData),
      })
        .then((response) => {
          console.log("Stop response status:", response.status); // Log response status
          return response.json();
        })
        .then((data) => {
          console.log("Stop response data:", data); // Log response data
        })
        .catch((error) => console.error("Error stopping services:", error));
    }
  };

  return (
    <div className="homepage">
      {/* Left Sidebar */}
      <div className="left-sidebar unique-left-sidebar">
        <h1 className="nodeselect unique-nodeselect">
          <FontAwesomeIcon icon={faNetworkWired} /> Select Platform
        </h1>
        <select value={selectedPlatform} onChange={handlePlatformSelect} className="unique-platform-select">
          <option value="">Select Platform</option>
          {platforms.map((platform, index) => (
            <option key={index} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        {platformData.length > 0 && (
          <button className="unique-startstopbtn" onClick={handleStartStopToggle}>
            {isRunning ? "Stop" : "Start"}
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="contentnm unique-contentnm">
        <h2>Predefined Configurations</h2>
        <div className="card-container unique-card-container">
          {platformData.length > 0 ? (
            platformData.map((node, index) => (
              <div key={node.node_id} className="card unique-node-card">
                <span className="node-number unique-node-number">#{index + 1}</span>
                <p className="node-id unique-node-id">Node ID: {node.node_id}</p>
                <p className="node-frequency unique-node-frequency">Frequency: {node.frequency}</p>
                <p className="node-platform unique-node-platform">Platform: {node.platform}</p>
                <p className="node-protocol unique-node-protocol">Protocol: {node.protocol}</p>

                {/* Display parameters in a table format */}
                {node.parameters && node.parameters.length > 0 && (
                  <div className="parameter-sections unique-parameter-sections">
                    <h3 className="parameter-title unique-parameter-title">Parameters:</h3>
                    <table className="parameter-table unique-parameter-table">
                      <thead>
                        <tr>
                          <th className="parameter-name-header">Name</th>
                          <th className="parameter-min-header">Min Value</th>
                          <th className="parameter-max-header">Max Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {node.parameters.map((parameter) => (
                          <tr key={parameter.id} className="parameter-row">
                            <td className="parameter-name">{parameter.name}</td>
                            <td className="parameter-min-value">{parameter.min_value}</td>
                            <td className="parameter-max-value">{parameter.max_value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No nodes available for the selected platform.</p>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar unique-right-sidebar">
        <div className="table-container unique-table-container">
          <Status />
        </div>
        <Terminal />
      </div>
    </div>
  );
};

export default PredefinedConfigurations;
