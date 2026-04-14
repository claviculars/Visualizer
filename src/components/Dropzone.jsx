import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

const Dropzone = ({ onFileDrop, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    if (file.name.endsWith('.log') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileDrop(e.target.result);
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please upload a .log or .json file.");
    }
  };

  return (
    <div className="dropzone-container">
      <div 
        className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input 
          type="file" 
          accept=".log,.json" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />
        
        {isDragging ? (
          <UploadCloud className="dropzone-icon" size={64} />
        ) : (
          <FileText className="dropzone-icon" size={64} />
        )}
        
        <div style={{ textAlign: 'center' }}>
          <h2 className="heading-lg" style={{ marginBottom: '8px' }}>
            <span className="text-gradient">Drop your IMC log file here</span>
          </h2>
          <p className="text-secondary">
            Drag and drop your .log or .json file, or click to browse.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '8px', marginTop: '16px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;
