/**
 * MapComponent
 *
 * Renders an interactive map of projects in Region 1 (Ilocos Region) with filtering by province, status, and sector.
 * - Web-only: Uses Leaflet and React-Leaflet via dynamic imports.
 * - Features: Search, autocomplete, project popups, custom marker colors, province/sector/status filters, and responsive UI.
 * - Data: Loads from backend API.
 * - Sector filtering and dynamic sector list are supported.
 * - Circular markers with status-based colors for better visibility.
 * - Map boundary restrictions prevent panning outside Region 1.
 *
 * Usage: <MapComponent />
 */
import React, { useState, useEffect, useRef } from 'react';
import MapSearchBox from './MapSearch';
import FiltersPanel from './FiltersPanel';
import Legend from './Legend';
import { getMarkerColor, getSectorIcon } from './mapUtils';
import MapModal from './MapModal';
import RegionMap from './RegionMap';
import CustomZoomControl from './CustomZoomControl';

// Region 1 (Ilocos Region) boundary
const region1Boundary = [
  [15.4, 119.9],
  [19.0, 121.3]
];

const provinceBoundaries = {
  'Ilocos Norte': {
    center: [18.1686, 120.7056],
    bounds: [[17.8, 120.3], [18.5, 121.1]],
    zoom: 9
  },
  'Ilocos Sur': {
    center: [17.5667, 120.3833],
    bounds: [[17.2, 120.0], [17.9, 120.7]],
    zoom: 9
  },
  'La Union': {
    center: [16.5000, 120.3333],
    bounds: [[16.1, 120.0], [16.9, 120.7]],
    zoom: 9
  },
  'Pangasinan': {
    center: [15.9167, 120.3333],
    bounds: [[15.5, 119.8], [16.3, 120.8]],
    zoom: 8
  },
};

const MapComponent = () => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapComponents, setMapComponents] = useState(null);
  const [L, setL] = useState(null);
  const [selectedProvinces, setSelectedProvinces] = useState(['All']);
  const [selectedStatuses, setSelectedStatuses] = useState(['All']);
  const [mapRef, setMapRef] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState(null);

  const [projectsData, setProjectsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [provinces, setProvinces] = useState(['All']);
  const [statuses, setStatuses] = useState(['All']);
  const [selectedSectors, setSelectedSectors] = useState(['All']);
  const [sectors, setSectors] = useState(['All']);
  const [selectedYear, setSelectedYear] = useState('All');
  const [years, setYears] = useState(['All']);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(8);
  const minZoom = 8;
  const maxZoom = 13;

  const region1Center = [18.1, 120.7];
  const zoomLevel = 8;

  const markerRefs = useRef({});
  const zoomEndHandlerRef = useRef(null);
  const popupJustClosedRef = useRef(false);
  const zoomResetTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [projects, provincesList] = await Promise.all([
          fetch('http://192.168.0.146:5000/api/projects-with-location')
            .then(response => response.json())
            .then(data => data),
          fetch('http://192.168.0.146:5000/api/provinces')
            .then(response => response.json())
            .then(data => data)
        ]);

        if (!mounted) return;

        const nonProcessingProjects = projects.filter(project => project.status !== 'Processing');
        const uniqueStatuses = ['All', ...new Set(nonProcessingProjects.map(p => p.status))];
        const uniqueSectors = ['All', ...new Set(nonProcessingProjects.map(p => p.sector))];
        const uniqueYears = ['All', ...new Set(nonProcessingProjects.map(p =>
          p.year ? p.year.includes('-') ? p.year.split('-')[0] : p.year : ''
        ).filter(Boolean))].sort((a, b) => b.localeCompare(a));

        setProjectsData(nonProcessingProjects);
        setProvinces(['All', ...provincesList]);
        setStatuses(uniqueStatuses);
        setSectors(uniqueSectors);
        setYears(uniqueYears);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading data:', err);
        setError('Failed to load data. Using fallback data.');
        const fallbackData = {
          projects: [
            { project_no: 'PJ001', title: 'Sample Project 1', firm_name: 'Sample Firm 1', status: 'Completed', sector: 'Agriculture', year: '2022', latitude: '18.1', longitude: '120.7', province: 'Ilocos Norte' },
            { project_no: 'PJ002', title: 'Sample Project 2', firm_name: 'Sample Firm 2', status: 'Ongoing', sector: 'Education', year: '2023', latitude: '17.5', longitude: '120.3', province: 'Ilocos Sur' },
            { project_no: 'PJ003', title: 'Sample Project 3', firm_name: 'Sample Firm 3', status: 'Completed', sector: 'Health', year: '2021', latitude: '16.5', longitude: '120.3', province: 'La Union' },
            { project_no: 'PJ004', title: 'Sample Project 4', firm_name: 'Sample Firm 4', status: 'Ongoing', sector: 'Transportation', year: '2024', latitude: '15.9', longitude: '120.3', province: 'Pangasinan' },
          ],
          provinces: ['All', 'Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
          statuses: ['All', 'Completed', 'Ongoing', 'Processing'],
          sectors: ['All', 'Agriculture', 'Education', 'Health', 'Transportation'],
          years: ['All', '2024', '2023', '2022', '2021']
        };
        setProjectsData(fallbackData.projects);
        setProvinces(['All', ...fallbackData.provinces]);
        setStatuses(['All', ...fallbackData.statuses]);
        setSectors(['All', ...fallbackData.sectors]);
        setYears(['All', ...fallbackData.years]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const zoomToProvinces = (provinces) => {
    if (!mapRef) return;
    if (provinces.length === 1 && provinces[0] !== 'All' && provinceBoundaries[provinces[0]]) {
      const bounds = provinceBoundaries[provinces[0]];
      mapRef.setView(bounds.center, bounds.zoom);
    } else if (provinces.length > 1 && !provinces.includes('All')) {
      let minLat = 90, minLng = 180, maxLat = -90, maxLng = -180;
      provinces.forEach(prov => {
        const b = provinceBoundaries[prov];
        if (b) {
          minLat = Math.min(minLat, b.bounds[0][0]);
          minLng = Math.min(minLng, b.bounds[0][1]);
          maxLat = Math.max(maxLat, b.bounds[1][0]);
          maxLng = Math.max(maxLng, b.bounds[1][1]);
        }
      });
      if (minLat < maxLat && minLng < maxLng) {
        mapRef.fitBounds([[minLat, minLng], [maxLat, maxLng]]);
      }
    } else {
      mapRef.setView(region1Center, zoomLevel);
    }
  };

  const handleProvinceChange = (provinces) => {
    setSelectedProvinces(provinces.length === 0 ? ['All'] : provinces);
    zoomToProvinces(provinces.length === 0 ? ['All'] : provinces);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filteredSuggestions = projectsData.filter(project =>
        (project.title?.toLowerCase() || '').includes(query.toLowerCase()) ||
        (project.firm_name?.toLowerCase() || '').includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
    setSelectedProject(null);
  };

  const handleSuggestionClick = (project) => {
    if (selectedProject && selectedProject.project_no === project.project_no) {
      setSearchQuery(project.title || '');
      setSuggestions([]);
      return;
    }

    setSearchQuery(project.title || '');
    setSuggestions([]);
    setSelectedProject(project);

    if (mapRef) {
      mapRef.dragging && mapRef.dragging.enable();
      mapRef.scrollWheelZoom && mapRef.scrollWheelZoom.enable();
      mapRef.doubleClickZoom && mapRef.doubleClickZoom.enable();
      mapRef.touchZoom && mapRef.touchZoom.enable();
      mapRef.boxZoom && mapRef.boxZoom.enable();
      mapRef.keyboard && mapRef.keyboard.enable();

      mapRef.setMinZoom(8);
      mapRef.setMaxZoom(14);

      const lat = Number(project.latitude);
      const lng = Number(project.longitude);

      const currentZoom = mapRef.getZoom();
      mapRef.setView([lat, lng], currentZoom, { animate: true });

      setTimeout(() => {
        const markerRef = markerRefs.current[project.project_no];
        if (markerRef && markerRef._map) {
          markerRef.openPopup();
        }
      }, 300);
    }
  };

  const handleClearSearch = () => {
    const wasProjectSelected = !!selectedProject;
    setSearchQuery('');
    setSuggestions([]);
    setSelectedProject(null);

    if (wasProjectSelected && mapRef) {
      if (selectedProvinces[0] !== 'All') {
        zoomToProvinces(selectedProvinces);
      } else {
        mapRef.setView(region1Center, zoomLevel);
      }
      if (mapRef.closePopup) {
        mapRef.closePopup();
      }
    }
  };

  const handleMarkerClick = (project) => {
    if (selectedProject && selectedProject.project_no === project.project_no) {
      return;
    }

    if (zoomResetTimeoutRef.current) {
      clearTimeout(zoomResetTimeoutRef.current);
      zoomResetTimeoutRef.current = null;
    }
    setSelectedProject(project);

    // Open the Leaflet popup at the marker location
    setTimeout(() => {
      const markerRef = markerRefs.current[project.project_no];
      if (markerRef && markerRef._map) {
        markerRef.openPopup();
      }
    }, 300);
  };

  const handlePopupClose = () => {
    popupJustClosedRef.current = true;
    if (mapRef && zoomEndHandlerRef.current) {
      mapRef.off('zoomend', zoomEndHandlerRef.current);
      zoomEndHandlerRef.current = null;
    }
    setSelectedProject(null);
    setSearchQuery('');
    setSuggestions([]);
    if (zoomResetTimeoutRef.current) {
      clearTimeout(zoomResetTimeoutRef.current);
      zoomResetTimeoutRef.current = null;
    }
    if (mapRef) {
      mapRef.dragging && mapRef.dragging.enable();
      mapRef.scrollWheelZoom && mapRef.scrollWheelZoom.enable();
      mapRef.doubleClickZoom && mapRef.doubleClickZoom.enable();
      mapRef.touchZoom && mapRef.touchZoom.enable();
      mapRef.boxZoom && mapRef.boxZoom.enable();
      mapRef.keyboard && mapRef.keyboard.enable();
      mapRef.setMinZoom(8);
      mapRef.setMaxZoom(14);
      // Close any open popup
      if (mapRef.closePopup) {
        mapRef.closePopup();
      }
    }
  };

  const handleStatusChange = (statuses) => {
    setSelectedStatuses(statuses.length === 0 ? ['All'] : statuses);
  };

  const handleSectorChange = (sector) => {
    const newSector = sector === 'All' ? 'All' : sector;
    const shouldReset = selectedSectors.length === 1 && selectedSectors[0] === sector;
    setSelectedSectors(shouldReset ? ['All'] : [newSector]);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const filteredProjects = projectsData.filter(project => {
    const provinceMatch =
      selectedProvinces.includes('All') || selectedProvinces.includes(project.province);
    const statusMatch = selectedStatuses.includes('All') || selectedStatuses.includes(project.status);
    const sectorMatch = selectedSectors.includes('All') || selectedSectors.includes(project.sector);

    const projectYear = project.year ?
      project.year.includes('-') ?
        project.year.split('-')[0] :
        project.year
      : '';
    const yearMatch = selectedYear === 'All' || selectedYear === projectYear;

    return provinceMatch && statusMatch && sectorMatch && yearMatch;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadMapLibraries = async () => {
        try {
          const leafletCss = document.createElement('link');
          leafletCss.rel = 'stylesheet';
          leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(leafletCss);

          const leaflet = await import('leaflet');
          const L = leaflet.default;
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });

          const reactLeaflet = await import('react-leaflet');

          setL(L);
          setMapComponents({
            MapContainer: reactLeaflet.MapContainer,
            TileLayer: reactLeaflet.TileLayer,
            Marker: reactLeaflet.Marker,
            Popup: reactLeaflet.Popup,
            Rectangle: reactLeaflet.Rectangle,
            ZoomControl: reactLeaflet.ZoomControl, // Add this line
            useMap: reactLeaflet.useMap, // Add this line to ensure MapInstanceSetter works
          });
          setIsMapReady(true);
        } catch (error) {
          setError('Failed to load map libraries. Please check your internet connection or try again later.');
        }
      };

      loadMapLibraries();
    }
  }, []);

  const createCustomIcon = (status, projectId, sector) => {
    if (!L) return null;
    const color = getMarkerColor(status);
    const iconSize = 30;
    const sectorIcon = getSectorIcon(sector);
    const iconColor = '#fff'; // Always use white for icon color
    const icons = Array.from(sectorIcon); // Restore this line to fix ReferenceError
    const isDouble = icons.length > 1;
    const isGear = sectorIcon === '⚙️';
    const fontSize = isGear
      ? 28
      : isDouble
        ? 12
        : 22;
    const gap = isDouble ? 4 : 0;
    const isTextile = sectorIcon === '👕';
    const isMetal = sectorIcon === '⚙️';
    let extraTransform = '';
    if (isTextile) extraTransform = 'translateY(-7%)';
    if (isMetal) extraTransform = 'translateX(7%)';
    return new L.DivIcon({
      className: 'custom-marker',
      html: `
        <div data-project-id="${projectId}" style="
          position: relative;
          width: ${iconSize}px;
          height: ${iconSize * 1.7}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          background: none;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: ${iconSize}px;
            height: ${iconSize}px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(44,62,80,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            padding: 2px;
          ">
            <span style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 90%; overflow: hidden; gap: ${gap}px; line-height: 1; font-size: ${fontSize}px; color: ${iconColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.25); transform: ${extraTransform};">
              ${icons.map(icon => `<span>${icon}</span>`).join('')}
            </span>
          </div>
          <div style="
            position: absolute;
            top: ${iconSize * 0.6}px;
            left: 50%;
            transform: translateX(-50%);
            width: ${iconSize * 0.7}px;
            height: ${iconSize * 0.9}px;
            z-index: 1;
          ">
            <svg width="100%" height="100%" viewBox="0 0 40 52" style="display:block;" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0 C38 0 38 32 20 52 C2 32 2 0 20 0 Z" fill="${color}" stroke="#fff" stroke-width="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [iconSize, iconSize * 1.7],
      iconAnchor: [iconSize / 2, iconSize * 1.7],
    });
  };

  useEffect(() => {
    if (!selectedProject || popupJustClosedRef.current) return;
    if (mapRef) {
      if (zoomEndHandlerRef.current) {
        mapRef.off('zoomend', zoomEndHandlerRef.current);
        zoomEndHandlerRef.current = null;
      }
      const timeoutId = setTimeout(() => {
        if (mapRef && selectedProject) {
          mapRef.dragging && mapRef.dragging.disable();
          mapRef.scrollWheelZoom && mapRef.scrollWheelZoom.disable();
          mapRef.doubleClickZoom && mapRef.doubleClickZoom.disable();
          mapRef.touchZoom && mapRef.touchZoom.disable();
          mapRef.boxZoom && mapRef.boxZoom.disable();
          mapRef.keyboard && mapRef.keyboard.disable();
          const currentZoom = mapRef.getZoom();
          mapRef.setMinZoom(currentZoom);
          mapRef.setMaxZoom(currentZoom);
        }
      }, 300);

      const zoomListener = () => {
        if (popupJustClosedRef.current) return;
        const markerRef = markerRefs.current[selectedProject.project_no];
        if (markerRef && markerRef._map) {
          setTimeout(() => {
            markerRef.openPopup();
          }, 150);
        }
      };
      mapRef.on('zoomend', zoomListener);
      zoomEndHandlerRef.current = zoomListener;

      return () => {
        clearTimeout(timeoutId);
        if (zoomEndHandlerRef.current) {
          mapRef.off('zoomend', zoomEndHandlerRef.current);
          zoomEndHandlerRef.current = null;
        }
      };
    }
  }, [mapRef, selectedProject]);

  useEffect(() => {
    if (!selectedProject && popupJustClosedRef.current) {
      const timeout = setTimeout(() => {
        popupJustClosedRef.current = false;
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const zoomControl = document.querySelector('.leaflet-control-zoom');
      if (zoomControl) {
        if (selectedProject) {
          zoomControl.classList.add('leaflet-control-zoom-disabled');
        } else {
          zoomControl.classList.remove('leaflet-control-zoom-disabled');
        }
      }
    }
  }, [selectedProject]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.getElementById('leaflet-zoom-disabled-style')) {
        const style = document.createElement('style');
        style.id = 'leaflet-zoom-disabled-style';
        style.innerHTML = `
          .leaflet-control-zoom-disabled {
            opacity: 0.5 !important;
            pointer-events: none !important;
            filter: grayscale(1) !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef && L) {
      const updateMinZoom = () => {
        const bounds = L.latLngBounds(region1Boundary);
        const mapDom = mapRef.getContainer();
        const width = mapDom.clientWidth;
        const height = mapDom.clientHeight;
        const minZoom = mapRef.getBoundsZoom(bounds, false, L.point(width, height));
        mapRef.setMinZoom(minZoom);
        mapRef.options.minZoom = minZoom;
      };
      updateMinZoom();
      window.addEventListener('resize', updateMinZoom);
      return () => window.removeEventListener('resize', updateMinZoom);
    }
  }, [mapRef, L]);

  let MapInstanceSetter = null;
  if (mapComponents && mapComponents.useMap) {
    const useMap = mapComponents.useMap;
    MapInstanceSetter = function({ setMap }) {
      const map = useMap();
      React.useEffect(() => {
        console.log('Setting mapRef to:', map);
        setMap(map);
      }, [map, setMap]);
      return null;
    };
  }

  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  useEffect(() => {
    if (mapRef) {
      mapRef.on('zoomend', () => {
        const zoom = mapRef.getZoom();
        setCurrentZoom(zoom);
      });
    }
  }, [mapRef]);

  if (error) {
    return (
      <div style={styles.container}>
        <span style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', marginTop: 40 }}>{error}</span>
      </div>
    );
  }

  if (!isMapReady || !mapComponents || isLoading) {
    return (
      <div style={styles.container}>
        <span style={styles.loadingText}>
          {isLoading ? 'Loading project data...' : 'Loading map...'}
        </span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Rectangle } = mapComponents;

  const modalWebStyle = true ? {
    maxHeight: '90vh',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: 18,
    minWidth: '320px',
    maxWidth: '480px',
    width: '100%',
    position: 'relative',
  } : {};
  const modalCloseWebStyle = true ? {
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: '20px',
    width: '40px',
    height: '40px',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    display: 'flex',
  } : {};
  const modalScrollWebStyle = true ? {
    padding: '28px',
    paddingTop: '18px',
    flex: 1,
    overflowY: 'auto',
    fontSize: '18px',
    lineHeight: '1.6',
  } : {};
  const modalAccentWebStyle = true ? {
    height: '3px',
    width: '100%',
    backgroundColor: '#6cb4e4',
    borderTopLeftRadius: '18px',
    borderTopRightRadius: '18px',
  } : {};
  const modalCloseButtonTextWebStyle = true ? {
    fontSize: '28px',
    color: '#444',
    fontWeight: 'bold',
    lineHeight: '32px',
    border: 'none',
    background: 'none',
    padding: 0,
    margin: 0,
    display: 'block',
  } : {};
  const modalTitleWebStyle = true ? {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '14px',
    color: '#22334a',
  } : {};

  // ... modalWebStyle, modalCloseWebStyle, etc. (unchanged from your original file) ...

  // (For brevity, you can copy the modalWebStyle, modalCloseWebStyle, etc. from your original file here.)

  return (
    <div style={styles.container}>
      {true && isFilterPanelOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '320px',
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={styles.title}>Region 1 (Ilocos Region) Projects Map</span>
      <div style={styles.mainMapContainer}>
        {true && (
          <>
            <div style={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 999,
              backgroundColor: 'white',
              borderRadius: 18, // subtle pill shape
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px 0 0',
              maxWidth: 420, // slightly reduced width
              width: '100%',
              gap: '0',
            }}>
              <button
                onClick={toggleFilterPanel}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTopLeftRadius: 12,
                  borderBottomLeftRadius: 12,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  marginRight: 0,
                  height: 56,
                }}
                aria-label="Open filters menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20M4 12H20M4 18H20" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <MapSearchBox
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onClearSearch={handleClearSearch}
                  suggestions={suggestions}
                  onSuggestionClick={(suggestion) => {
                    const project = suggestions.find(p => p.project_no === suggestion.project_no);
                    if (project) {
                      handleSuggestionClick(project);
                    }
                  }}
                  styles={{
                    searchContainer: {
                      flex: 1,
                      position: 'relative',
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      margin: 0,
                    },
                    searchInputContainer: {
                      position: 'relative',
                      width: '100%',
                    },
                    searchInput: {
                      width: '100%',
                      padding: 12,
                      paddingRight: 40, // move icon to right
                      backgroundColor: 'white',
                      borderWidth: 0,
                      borderRadius: 0,
                      borderTopRightRadius: 12,
                      borderBottomRightRadius: 12,
                      fontSize: 16,
                      color: '#333333',
                      boxShadow: 'none',
                    },
                    searchIcon: {
                      position: 'absolute',
                      right: 12, // move icon to right
                      top: '50%',
                      marginTop: -10,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    clearSearchButton: {
                      position: 'absolute',
                      right: 36, // move clear button left of icon
                      top: '50%',
                      marginTop: -10,
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                      padding: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                    },
                    suggestionsContainer: {
                      position: 'absolute',
                      top: 44,
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      borderRadius: 8,
                      elevation: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 12,
                      maxHeight: 300,
                      overflow: 'hidden',
                      zIndex: 1000,
                      marginBottom: 120,
                    },
                    suggestionItem: {
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      justifyContent: 'center',
                      backgroundColor: 'white',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    },
                    suggestionContent: {
                      flexDirection: 'column',
                      gap: 4,
                    },
                    suggestionTitle: {
                      fontSize: 14,
                      color: '#333333',
                      fontWeight: '500',
                    },
                    suggestionDetails: {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 4,
                    },
                  }}
                  getMarkerColor={getMarkerColor}
                  placeholder="Search project or firm..."
                />
              </div>
            </div>
            {/* Remove custom zoom controls here. The block starts with the div at position: 'absolute', bottom: 20, right: 20, zIndex: 999, ... and contains two <button> elements for zoom in and out. */}
            {isFilterPanelOpen && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 1000,
                width: '320px',
                backgroundColor: 'white',
                boxShadow: '4px 0 8px rgba(0,0,0,0.1)',
                overflowY: 'auto',
              }}>
                <FiltersPanel
                  provinces={provinces}
                  statuses={statuses}
                  sectors={sectors}
                  years={years}
                  selectedProvinces={selectedProvinces}
                  selectedStatuses={selectedStatuses}
                  selectedSectors={selectedSectors}
                  selectedYear={selectedYear}
                  onProvinceChange={handleProvinceChange}
                  onStatusChange={handleStatusChange}
                  onSectorChange={handleSectorChange}
                  onYearChange={handleYearChange}
                  onClearFilters={() => {
                    setSelectedProvinces(['All']);
                    setSelectedStatuses(['All']);
                    setSelectedSectors(['All']);
                    setSelectedYear('All');
                    if (mapRef) {
                      mapRef.setView(region1Center, zoomLevel);
                    }
                  }}
                  onClose={() => setIsFilterPanelOpen(false)}
                  showClearFilters={
                    selectedProvinces[0] !== 'All' ||
                    selectedStatuses[0] !== 'All' ||
                    selectedSectors[0] !== 'All' ||
                    selectedYear !== 'All'
                  }
                  styles={styles}
                  getMarkerColor={getMarkerColor}
                  projectsData={projectsData}
                  filteredProjects={filteredProjects}
                />
              </div>
            )}
            {true && !isFilterPanelOpen && (
              <div style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 1001,
                maxWidth: '300px',
                width: '100%',
              }}>
                <Legend styles={styles} />
              </div>
            )}
          </>
        )}
        <div style={styles.mapContainer}>
          <RegionMap
            filteredProjects={filteredProjects}
            markerRefs={markerRefs}
            mapRef={mapRef}
            setMapRef={setMapRef}
            selectedProject={selectedProject}
            handleMarkerClick={handleMarkerClick}
            createCustomIcon={createCustomIcon}
            region1Center={region1Center}
            zoomLevel={zoomLevel}
            region1Boundary={region1Boundary}
            MapInstanceSetter={MapInstanceSetter}
            Platform={true}
            styles={styles}
            L={L}
            mapComponents={mapComponents}
          />
          <MapModal
            visible={!!selectedProject}
            onClose={handlePopupClose}
            selectedProject={selectedProject}
            styles={styles}
            getMarkerColor={getMarkerColor}
            titleStyle={{}}
            Platform={true}
          />
        </div>
      </div>
      {/* Reset View Button - centered at the bottom */}
      <div className="reset-btn-shell">
        <button
          onClick={() => {
            setSearchQuery('');
            setSuggestions([]);
            setSelectedProject(null);
            if (mapRef) {
              mapRef.dragging && mapRef.dragging.enable();
              mapRef.scrollWheelZoom && mapRef.scrollWheelZoom.enable();
              mapRef.doubleClickZoom && mapRef.doubleClickZoom.enable();
              mapRef.touchZoom && mapRef.touchZoom.enable();
              mapRef.boxZoom && mapRef.boxZoom.enable();
              mapRef.keyboard && mapRef.keyboard.enable();
              mapRef.setMinZoom(8);
              mapRef.setMaxZoom(14);
              mapRef.setView(region1Center, zoomLevel);
              mapRef.closePopup && mapRef.closePopup();
              // Remove disabled class from zoom controls
              const zoomControl = document.querySelector('.leaflet-control-zoom');
              if (zoomControl) {
                zoomControl.classList.remove('leaflet-control-zoom-disabled');
              }
            }
          }}
          className="reset-btn"
          aria-label="Reset map view"
          disabled={!!selectedProject || isFilterPanelOpen}
          style={selectedProject || isFilterPanelOpen ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

const styles = {
    container: {
      flex: 1,
      position: 'relative',
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#2c3e50',
      marginBottom: 8,
    },
    mainMapContainer: {
      flex: 1,
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    mapContainer: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      width: '100%',
      height: '100%',
      minHeight: '400px',
    },
    controlsPanel: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 320,
      backgroundColor: 'white',
      zIndex: 9990,
      padding: 20,
      boxShadow: '0 0 15px rgba(0,0,0,0.1)',
    },
    searchContainer: {
      marginBottom: 16,
      position: 'relative',
      zIndex: 100,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5, // Use number
    },
    searchInputContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 16,
      width: '100%',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    searchInput: {
      width: '100%',
      fontSize: 15,
      borderRadius: 16,
      borderWidth: 0,
      backgroundColor: 'transparent',
      color: '#1f2937',
      fontWeight: '400',
      paddingTop: 16,
      paddingBottom: 16,
      paddingRight: 44,
      paddingLeft: 20,
    },
    clearSearchButton: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#f3f4f6',
      borderWidth: 0,
      fontSize: 16,
      color: '#6b7280',
      padding: 6,
      borderRadius: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearSearchButtonHover: {
      backgroundColor: '#e5e7eb',
      color: '#374151',
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#d1d5db',
      zIndex: 1000,
      marginTop: 8,
      maxHeight: 400,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      overflowY: 'auto',
    },
    suggestionItem: {
      paddingTop: 14,
      paddingBottom: 14,
      paddingRight: 20,
      paddingLeft: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      backgroundColor: 'white',
      fontSize: 15,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    suggestionItemHover: {
      backgroundColor: '#f1f5f9',
      cursor: 'pointer',
    },
    countContainer: {
      backgroundColor: '#e8f4fd',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#b3d9ff',
      marginBottom: 12,
    },
    countText: {
      fontSize: 14,
      color: '#2c3e50',
      fontWeight: '500',
      textAlign: 'center',
    },
    filtersSection: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    filterContainer: {
      marginBottom: 12,
    },
    filterButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    filterButton: {
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#3498db',
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: '#3498db',
    },
    filterButtonText: {
      color: '#3498db',
      fontSize: 12,
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: 'white',
    },
    clearFiltersContainer: {
      alignItems: 'center',
      paddingTop: 8,
    },
    clearFiltersButton: {
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 16,
      paddingRight: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#e74c3c',
      backgroundColor: 'white',
    },
    clearFiltersButtonText: {
      color: '#e74c3c',
      fontSize: 12,
      fontWeight: '600',
    },
    notSupportedText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#7f8c8d',
      marginTop: 50,
      padding: 20,
    },
    loadingText: {
      textAlign: 'center',
      fontSize: 18,
      color: '#2c3e50',
      marginTop: 50,
      fontWeight: '500',
    },
    legend: {
      backgroundColor: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(44, 62, 80, 0.08)',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginTop: 2,
      marginBottom: 2,
      alignItems: 'flex-start',
      minWidth: 120,
      maxWidth: 180,
      border: '1px solid #e5e7eb',
    },
    legendTitle: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 6,
      color: '#2c3e50',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    legendItems: {
      flexDirection: 'column',
      gap: 6,
      width: '100%',
    },
    legendSection: {
      marginBottom: 8,
    },
    legendSectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
      minWidth: 70,
      marginRight: 4,
    },
    legendText: {
      fontSize: 11,
      color: '#2c3e50',
      marginLeft: 6,
      fontWeight: '500',
    },
    legendColor: {
      width: 11,
      height: 11,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'white',
    },
    legendIcon: {
      fontSize: 12,
      width: 14,
      textAlign: 'center',
    },
    popupContent: {
      minWidth: 220,
      maxWidth: 320,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    popupTitle: {
      marginBottom: 8,
      color: '#2c3e50',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'left',
    },
    popupRow: {
      marginBottom: 6,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      flexWrap: 'wrap',
    },
    statusBadge: {
      color: 'white',
      paddingTop: 2,
      paddingBottom: 2,
      paddingLeft: 8,
      paddingRight: 8,
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 4,
    },
    popupDetail: {
      fontSize: 14,
      color: '#222',
      fontWeight: '400',
    },
    searchIcon: {
      position: 'absolute',
      left: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      fontSize: 18,
      zIndex: 2,
    },
    suggestionContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
    },
    suggestionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1f2937',
      lineHeight: 22,
      width: '100%',
      marginBottom: 4,
    },
    suggestionDetails: {
      display: 'flex',
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
      width: '100%',
    },
    suggestionStatus: {
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 20,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: 'white',
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    suggestionAddress: {
      fontSize: 13,
      color: '#4b5563',
      lineHeight: 18,
      flex: 1,
      minWidth: 0,
      fontWeight: '400',
    },
    resetButtonContainer: {
      alignItems: 'center',
      marginBottom: 12,
    },
    resetButtonContainerBottom: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 24,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'box-none',
    },
    resetButton: {
      backgroundColor: '#3498db',
      paddingVertical: 10,
      paddingHorizontal: 28,
      borderRadius: 20,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    resetButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    resetButtonPressed: {
      backgroundColor: '#2980b9',
    },
    mapOverlay: {
      display: 'none', // Overlay no longer needed
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 4000,
      padding: 16,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 18,
      padding: 0,
      minWidth: 320,
      maxWidth: 480,
      width: '100%',
      position: 'relative',
      maxHeight: 600,
    },
    modalAccent: {
      height: 6,
      width: '100%',
      backgroundColor: '#3498db',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    },
    modalScrollContent: {
      padding: 28,
      paddingTop: 18,
      flex: 1,
    },
    modalCloseButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 10,
      backgroundColor: '#f3f4f6',
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
    },
    modalCloseButtonText: {
      fontSize: 28,
      color: '#444',
      fontWeight: 'bold',
      lineHeight: 32,
    },
    hamburgerButton: {
      position: 'absolute',
      left: 20,
      top: 20,
      zIndex: 9995,
      backgroundColor: 'white',
      borderRadius: 8,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    hamburgerLine: {
      width: 20,
      height: 2,
      backgroundColor: '#333',
      marginBottom: 4,
    },
    filterPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    filterPanelTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#222',
    },
  };
  
  export default MapComponent;