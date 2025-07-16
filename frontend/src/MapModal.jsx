import React from 'react';
import MapPopup from './MapPopup';

const MapModal = ({
  visible,
  onClose,
  selectedProject,
  styles,
  getMarkerColor,
}) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      transition: 'background 0.2s',
    }}>
      <div style={{
        maxHeight: '90%',
        boxShadow: '0 12px 48px rgba(44,62,80,0.25)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '28px',
        minWidth: '340px',
        maxWidth: '520px',
        width: '100%',
        position: 'relative',
        alignSelf: 'center',
        padding: '38px 38px 32px 38px',
        fontFamily: 'inherit',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            zIndex: 10,
            backgroundColor: '#f3f4f6',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '26px',
            color: '#22334a',
            fontWeight: 'bold',
            lineHeight: '32px',
            boxShadow: '0 2px 8px rgba(44,62,80,0.10)',
            transition: 'background 0.15s',
          }}
          aria-label="Close modal"
        >
          ×
        </button>
        <div style={{
          padding: 0,
          flex: 1,
          fontSize: '18px',
          lineHeight: '24px',
        }}>
          {selectedProject && (
            <MapPopup 
              project={selectedProject} 
              styles={styles} 
              getMarkerColor={getMarkerColor} 
              titleStyle={{
                fontSize: '22px',
                fontWeight: 'bold',
                marginBottom: '18px',
                color: '#22334a',
                textAlign: 'left',
                letterSpacing: 0.2,
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MapModal; 