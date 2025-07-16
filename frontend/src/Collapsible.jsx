import React, { useState } from 'react';

const Collapsible = ({ children, title, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ backgroundColor: 'white' }}>
      <button
        onClick={() => setIsOpen((value) => !value)}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'white',
          padding: '12px',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <span
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: '16px',
            color: '#1f2937'
          }}
        >
          ▶
        </span>
        <span style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#111827'
        }}>
          {title}
        </span>
      </button>
      {isOpen && (
        <div style={{
          marginTop: '6px',
          marginLeft: '24px',
          backgroundColor: 'white'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
