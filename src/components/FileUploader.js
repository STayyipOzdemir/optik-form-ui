import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const FileUploader = ({ onFileSelect, selectedFile,  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file) onFileSelect(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#2563eb';
    e.currentTarget.style.backgroundColor = '#eff6ff';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.backgroundColor = '#f9fafb';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
    // reset styles
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.backgroundColor = '#f9fafb';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        border: '2px dashed #d1d5db',
        borderRadius: '1rem',
        backgroundColor: '#f9fafb',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Dosyanızı (görüntü veya PDF) seçin ya da buraya sürükleyin
        </p>
      </div>

      <button
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          fontWeight: '600',
          fontSize: '1.1rem',
          padding: '1rem 2rem',
          borderRadius: '0.75rem',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1d4ed8';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 12px -2px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
      >
        <Upload size={24} />
        Dosya Seç
      </button>

      {selectedFile && (
        <p style={{ fontSize: '1rem', color: '#16a34a', marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
          ✓ Seçilen dosya: {selectedFile.name}
        </p>
      )}
    </div>
  );
};

export default FileUploader;
