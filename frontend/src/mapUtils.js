// mapUtils.js

// Custom marker colors based on status
export const getMarkerColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#28a745'; // Green
      case 'Ongoing':
        return '#ffc107'; // Yellow
      case 'Processing':
        return '#17a2b8'; // Blue
      case 'Terminated':
        return '#dc3545'; // Red
      default:
        return '#007bff'; // Blue
    }
  };
  
  // Sector icon mapping
  export const getSectorIcon = (sector) => {
    if (!sector) return '📋';
    const s = sector.toLowerCase();
    if (s.includes('agri') || s.includes('fishery') || s.includes('natural')) return '🌾';
    if (s.includes('food') || s.includes('beverage')) return '🥫';
    if (s.includes('textile') || s.includes('apparel')) return '👕';
    if (s.includes('leather') || s.includes('wood') || s.includes('paper') || s.includes('furniture')) return '🪑';
    if (s.includes('chemical') || s.includes('pharma')) return '⚗️';
    if (s.includes('plastic') || s.includes('rubber') || s.includes('non-metallic')) return '🛢️';
    if (s.includes('metal') || s.includes('machinery') || s.includes('transport')) return '⚙️';
    if (s.includes('information') || s.includes('communication') || s.includes('ict')) return '💻';
    if (s.includes('other') || s.includes('regional')) return '🏢';
    return '📋';
  }; 