import React from 'react';

const MapPopup = ({ project, styles = {}, getMarkerColor, titleStyle = {} }) => {
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') {
      return 'Not specified';
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return 'Invalid amount';
    }
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === '') {
      return 'Not specified';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div
        style={{
          fontSize: 21,
          fontWeight: 700,
          color: '#22334a',
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        {project.title}
      </div>
      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontWeight: 600, fontSize: 15, marginRight: 7 }}>Status:</span>
        <span
          style={{
            background: '#ffe082',
            color: '#22334a',
            fontWeight: 600,
            borderRadius: 10,
            padding: '2px 12px',
            fontSize: 14,
            letterSpacing: 0.2,
            marginLeft: 2,
            display: 'inline-block',
          }}
        >
          {project.status}
        </span>
      </div>
      {/* Firm */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Firm: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{project.firm_name}</span>
      </div>
      {/* SPIN */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>SPIN: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{project.SPIN || 'Not specified'}</span>
      </div>
      {/* Intervention */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Intervention: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{project.intervention || 'Not specified'}</span>
      </div>
      {/* Fund Source */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Fund Source: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{project.fund_source || 'Not specified'}</span>
      </div>
      {/* Assistance Amount */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Assistance Amount: </span>
        <span style={{ color: '#444', fontWeight: 600, fontSize: 14 }}>{formatCurrency(project.assistance_amount)}</span>
      </div>
      {/* Year */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Year: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{formatDate(project.year)}</span>
      </div>
      {/* Sector */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Sector: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{project.sector || 'Not specified'}</span>
      </div>
      {/* Location */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Location: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>{project.municipality}, {project.province}</span>
      </div>
      {/* Coordinates */}
      <div style={{ marginBottom: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Coordinates: </span>
        <span style={{ color: '#444', fontWeight: 400, fontSize: 14 }}>
          {Number(project.latitude).toFixed(4)}, {Number(project.longitude).toFixed(4)}
        </span>
      </div>
    </div>
  );
};

export default MapPopup; 