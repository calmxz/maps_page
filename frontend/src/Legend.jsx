import React, { useState } from 'react';

const sectorIcons = [
  { icon: '🌾', text: 'Agri-Fishery & Natural Resources' },
  { icon: '🥫', text: 'Food & Beverage Manufacturing' },
  { icon: '👕', text: 'Textile & Apparel Manufacturing' },
  { icon: '🪑', text: 'Leather, Wood, Paper & Furniture Manufacturing' },
  { icon: '⚗️', text: 'Chemical & Pharmaceutical Manufacturing' },
  { icon: '🛢️', text: 'Plastics, Rubber & Non-Metallics' },
  { icon: '⚙️', text: 'Metal, Machinery & Transport Equipment' },
  { icon: '💻', text: 'Information & Communication Technology' },
  { icon: '🏢', text: 'Other Regional Priority Industries' }
];

const COLLAPSED_COUNT = 4;

const defaultStyles = {
  legend: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: 400,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#1f2937',
  },
  legendItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  legendItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    marginRight: 8,
  },
  legendIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  seeAll: {
    color: '#2563eb',
    marginTop: 8,
    fontWeight: 500,
    alignSelf: 'flex-start',
    fontSize: 14,
    paddingLeft: 2,
    cursor: 'pointer',
  },
};

const Legend = ({ styles = {} }) => {
  const [showAll, setShowAll] = useState(false);
  return (
    <div style={{ ...defaultStyles.legend, ...styles.legend }}>
      <div style={{ ...defaultStyles.legendTitle, ...styles.legendTitle }}>Status Legend</div>
      <div style={{ ...defaultStyles.legendItems, ...styles.legendItems }}>
        <div style={{ ...defaultStyles.legendItem, ...styles.legendItem }}>
          <span style={{ ...defaultStyles.legendColor, backgroundColor: '#28a745' }} />
          <span style={{ ...defaultStyles.legendText, ...styles.legendText }}>Completed</span>
        </div>
        <div style={{ ...defaultStyles.legendItem, ...styles.legendItem }}>
          <span style={{ ...defaultStyles.legendColor, backgroundColor: '#ffc107' }} />
          <span style={{ ...defaultStyles.legendText, ...styles.legendText }}>Ongoing</span>
        </div>
        <div style={{ ...defaultStyles.legendItem, ...styles.legendItem }}>
          <span style={{ ...defaultStyles.legendColor, backgroundColor: '#dc3545' }} />
          <span style={{ ...defaultStyles.legendText, ...styles.legendText }}>Terminated</span>
        </div>
      </div>

      <div style={{ ...defaultStyles.legendTitle, ...styles.legendTitle, marginTop: 24 }}>Icon Legend</div>
      <div style={{ ...defaultStyles.legendItems, ...styles.legendItems }}>
        {(showAll ? sectorIcons : sectorIcons.slice(0, COLLAPSED_COUNT)).map(({ icon, text }) => (
          <div key={text} style={{ ...defaultStyles.legendItem, ...styles.legendItem }}>
            <span style={{ ...defaultStyles.legendIcon, ...styles.legendIcon }}>{icon}</span>
            <span style={{ ...defaultStyles.legendText, ...styles.legendText }}>{text}</span>
          </div>
        ))}
        {sectorIcons.length > COLLAPSED_COUNT && (
          <span
            style={defaultStyles.seeAll}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'See Less' : 'See All'}
          </span>
        )}
      </div>
    </div>
  );
};

export default Legend; 