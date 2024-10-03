import React, { useState, useEffect } from "react";
import "./Homepage.css";
import config from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSitemap, faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import Terminal from "./Terminal"; // Import the Terminal component
const NodeSelector = () => {
  const [nodes, setNodes] = useState([]);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [nodeDetails, setNodeDetails] = useState(null);
  const [frequency, setFrequency] = useState("");
  const [parameters, setParameters] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [selectedVertical, setSelectedVertical] = useState("");
  const [terminalData, setTerminalData] = useState(""); // State for terminal data

  // State to manage edit mode
  const [isEditingFrequency, setIsEditingFrequency] = useState(false);
  const [editingParams, setEditingParams] = useState([]);
  const [nodesData, setNodesData] = useState([]);
  const getServiceStateColor = (state) => {
    return state.toLowerCase() === "start" ? "green" : "red";
  };
  // const [tableData, setTableData] = useState([
  //   { id: 1, parameter: "Temperature", value: "25°C" },
  //   { id: 2, parameter: "Humidity", value: "60%" },
  //   { id: 3, parameter: "Pressure", value: "1013 hPa" },
  //   { id: 4, parameter: "Wind Speed", value: "5 m/s" },
  // ]);

  useEffect(() => {
    fetch(`${config.backendAPI}/verticals/`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVerticals(data);
        } else {
          console.error("Unexpected data format:", data);
          setVerticals([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching verticals:", error);
        setVerticals([]);
      });
  }, []);

  useEffect(() => {
    if (selectedVertical) {
      fetch(`${config.backendAPI}/nodes/vertical/${selectedVertical}`)
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setFilteredNodes(data);
            if (data.length > 0) {
              const lastNodeId = data[data.length - 1].node_id;
              setSelectedNodeId(lastNodeId);
            }
          } else {
            alert("Unexpected data format received for nodes.");
            setFilteredNodes([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching filtered nodes:", error);
          alert("Error fetching nodes. Please try again.");
        });
    } else {
      setFilteredNodes([]);
    }
  }, [selectedVertical]);

  useEffect(() => {
    fetch("http://localhost:8000/nodes/")
      .then((response) => response.json())
      .then((data) => {
        setNodesData(data);
      })
      .catch((error) => console.error("Error fetching nodes data:", error));
  }, []);

  useEffect(() => {
    if (selectedNodeId) {
      fetch(`${config.backendAPI}/nodes/all/${selectedNodeId}`)
        .then((response) => response.json())
        .then((data) => {
          setNodeDetails(data);
          if (data.frequency) {
            setFrequency(secondsToHMS(data.frequency));
          }
          setParameters(data.parameters || []);
          setEditingParams(Array(data.parameters.length).fill(false)); // Initialize edit state for parameters

          // Start terminal data streaming when node is selected
          const eventSource = new EventSource(`http://localhost:8000/services/events/`);
          eventSource.onmessage = (event) => {
            setTerminalData((prevData) => prevData + event.data + "\n");
          };

          eventSource.onerror = (error) => {
            console.error("EventSource failed:", error);
            eventSource.close();
          };

          return () => {
            eventSource.close();
          };
        })
        .catch((error) => console.error("Error fetching node details:", error));
    } else {
      setNodeDetails(null);
    }
  }, [selectedNodeId]);

  const handleNodeSelect = (event) => {
    setSelectedNodeId(event.target.value);
  };

  const handleVerticalSelect = (event) => {
    setSelectedVertical(event.target.value);
  };

  const secondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours.toString().padStart(2, "0"), minutes.toString().padStart(2, "0"), secs.toString().padStart(2, "0")].join(":");
  };

  const hmsToSeconds = (hms) => {
    const [hours, minutes, seconds] = hms.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleFrequencyChange = (event) => {
    setFrequency(event.target.value);
  };

  const handleParameterChange = (index, field, value) => {
    const updatedParameters = [...parameters];
    updatedParameters[index][field] = value;
    setParameters(updatedParameters);
  };

  const handleStart = (event) => {
    event.preventDefault();
    if (selectedNodeId && frequency) {
      const frequencyInSeconds = hmsToSeconds(frequency);

      const formattedParameters = parameters.map((param) => ({
        name: param.name,
        min: param.min_value,
        max: param.max_value,
      }));

      // Create the payload according to the desired structure
      const payload = [
        {
          node_id: selectedNodeId,
          frequency: frequencyInSeconds,
          parameters: formattedParameters,
          platform: nodeDetails.platform,
          protocol: nodeDetails.protocol,
        },
      ];

      fetch(`http://127.0.0.1:8000/services/start`, {
        method: "Put", // Use POST instead of PUT for starting services
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Send the formatted payload
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Start response:", data);
          setNodeDetails((prevDetails) => ({
            ...prevDetails,
            status: "start",
          }));
        })
        .catch((error) => console.error("Error starting service:", error));
    }
  };

  const handleStop = (event) => {
    event.preventDefault();
    if (selectedNodeId) {
      const payload = [
        {
          node_id: selectedNodeId,
        },
      ];

      fetch(`http://127.0.0.1:8000/services/stop`, {
        method: "Put", // Use POST for stopping services
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Send the formatted payload
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Stop response:", data);
          setNodeDetails((prevDetails) => ({
            ...prevDetails,
            status: "stop",
          }));
        })
        .catch((error) => console.error("Error stopping service:", error));
    }
  };

  const toggleEditFrequency = () => {
    setIsEditingFrequency((prev) => !prev);
  };

  const toggleEditParameter = (index) => {
    const newEditingParams = [...editingParams];
    newEditingParams[index] = !newEditingParams[index];
    setEditingParams(newEditingParams);
  };

  return (
    <div className="homepage">
      <div className="left-sidebar">
        <h1 className="nodeselect">
          <FontAwesomeIcon icon={faSitemap} /> Select Vertical
        </h1>
        <select value={selectedVertical} onChange={handleVerticalSelect}>
          <option value="">Select Vertical</option>
          {verticals.map((vertical) => (
            <option key={vertical.id} value={vertical.id}>
              {vertical.name}
            </option>
          ))}
        </select>

        <h1 className="nodeselect">
          <FontAwesomeIcon icon={faNetworkWired} /> Select Node
        </h1>
        <select value={selectedNodeId} onChange={handleNodeSelect} disabled={filteredNodes.length === 0}>
          <option value="">Select Node ID</option>
          {filteredNodes.map((node) => (
            <option key={node.node_id} value={node.node_id}>
              {node.node_id}
            </option>
          ))}
        </select>
      </div>

      <div className="contentss">
        {nodeDetails && (
          <div className="node-details">
            <h2>Node Details</h2>
            <table className="node-details-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vertical Name</td>
                  <td>{nodeDetails.vertical_name}</td>
                </tr>
                <tr>
                  <td>Node Id</td>
                  <td>{nodeDetails.node_id}</td>
                </tr>
                <tr>
                  <td>Platform</td>
                  <td>{nodeDetails.platform}</td>
                </tr>
                <tr>
                  <td>Protocol</td>
                  <td>{nodeDetails.protocol}</td>
                </tr>
                <tr>
                  <td>Frequency</td>
                  <td onClick={toggleEditFrequency} style={{ cursor: "pointer" }}>
                    {isEditingFrequency ? (
                      <input type="text" value={frequency} onChange={handleFrequencyChange} onBlur={toggleEditFrequency} placeholder="HH:MM:SS" />
                    ) : (
                      secondsToHMS(nodeDetails.frequency) || "N/A"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="edit-frequency">
              {nodeDetails.status === "stop" && !isEditingFrequency && (
                <button type="button" className="action-button" onClick={handleStart}>
                  Start
                </button>
              )}
              {nodeDetails.status === "start" && (
                <button type="button" className="action-button" onClick={handleStop}>
                  Stop
                </button>
              )}
            </div>

            <div className="parameters-section">
              <h3>Edit Parameters</h3>
              <div className="parameter-grid">
                {parameters.length > 0 ? (
                  parameters.map((param, index) => (
                    <div key={index} className="parameter-card">
                      <h4>{param.name}</h4>
                      <div onClick={() => toggleEditParameter(index)} style={{ cursor: "pointer" }}>
                        {editingParams[index] ? (
                          <>
                            <label>
                              Min:
                              <input type="number" value={param.min_value} onChange={(e) => handleParameterChange(index, "min_value", e.target.value)} />
                            </label>
                            <label>
                              Max:
                              <input type="number" value={param.max_value} onChange={(e) => handleParameterChange(index, "max_value", e.target.value)} />
                            </label>
                          </>
                        ) : (
                          <>
                            <p>Min: {param.min_value}</p>
                            <p>Max: {param.max_value}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No parameters available for this node.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="right-sidebar">
        <div className="data-table">
          {/* <h3>Nodes Data</h3> */}
          <table>
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Services</th>
              </tr>
            </thead>
            <tbody>
              {nodesData.map((node) => (
                <tr key={node.node_id}>
                  <td>{node.node_id}</td>
                  <td>
                    <div className="service-state">
                      <span className="state-indicator" style={{ backgroundColor: getServiceStateColor(node.services) }}></span>
                      {node.services}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div><br/>
        <Terminal data={terminalData} />
      </div>
    </div>
  );
};

export default NodeSelector;
