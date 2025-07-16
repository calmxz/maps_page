import React from 'react';

const controlStyle = {
  position: 'absolute',
  bottom: 20,
  right: 20,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  background: 'white',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  overflow: 'hidden',
};

const buttonStyle = {
  border: 'none',
  background: 'none',
  padding: 0,
  width: 40,
  height: 40,
  fontSize: 24,
  cursor: 'pointer',
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function CustomZoomControl({ mapRef, minZoom = 8, maxZoom = 13 }) {
  if (!mapRef) return null;

  const handleZoomIn = () => {
    if (mapRef.getZoom() < maxZoom) mapRef.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapRef.getZoom() > minZoom) mapRef.zoomOut();
  };

  return (
    <div style={controlStyle}>
      <button
        style={buttonStyle}
        onClick={handleZoomIn}
        disabled={mapRef.getZoom() >= maxZoom}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        style={buttonStyle}
        onClick={handleZoomOut}
        disabled={mapRef.getZoom() <= minZoom}
        aria-label="Zoom out"
      >
        –
      </button>
    </div>
  );
} 