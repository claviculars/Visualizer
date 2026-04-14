import React, { useState } from 'react';
import './App.css';
import { parseLogFile } from './utils/parser';
import Dropzone from './components/Dropzone';
import Dashboard from './components/Dashboard';

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileDrop = async (fileText) => {
    try {
      setError(null);
      const output = await parseLogFile(fileText);
      setParsedData(output);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="app-container">
      {!parsedData ? (
        <Dropzone onFileDrop={handleFileDrop} error={error} />
      ) : (
        <Dashboard data={parsedData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
