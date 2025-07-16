import React from 'react';

const RegionMap = ({
  filteredProjects,
  markerRefs,
  mapRef,
  setMapRef,
  selectedProject,
  handleMarkerClick,
  createCustomIcon,
  region1Center,
  zoomLevel,
  region1Boundary,
  MapInstanceSetter,
  styles,
  L,
  mapComponents,
}) => {
  if (!mapComponents) {
    console.log('MapComponents not loaded yet');
    return <div style={{...styles.mapContainer, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading map...</div>;
  }
  
  const { MapContainer, TileLayer, Marker, ZoomControl } = mapComponents;
  
  console.log('Rendering map with:', { filteredProjects: filteredProjects.length, mapComponents: !!mapComponents });
  
  return (
    <div style={{...styles.mapContainer, minHeight: '400px'}}>
      <MapContainer
        center={region1Center}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        zoomControl={false}
        minZoom={8}
        maxZoom={13}
        maxBounds={region1Boundary}
        maxBoundsViscosity={1.0}
        dragging={selectedProject == null}
        scrollWheelZoom={selectedProject == null}
        doubleClickZoom={selectedProject == null}
        touchZoom={selectedProject == null}
        worldCopyJump={false}
        eventHandlers={{}}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />
        {filteredProjects.map((project) => (
          <Marker
            key={project.project_no}
            position={[Number(project.latitude), Number(project.longitude)]}
            icon={createCustomIcon(project.status, project.project_no, project.sector)}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[project.project_no] = ref;
              }
            }}
            eventHandlers={{
              click: () => handleMarkerClick(project),
            }}
          />
        ))}
        {MapInstanceSetter && <MapInstanceSetter setMap={setMapRef} />}
      </MapContainer>
    </div>
  );
};

export default RegionMap; 