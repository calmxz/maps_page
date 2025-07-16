import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Collapsible from './Collapsible';

const dropdownStyle = {
  width: '100%',
  padding: '12px 40px 12px 16px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#4b5563',
  background: 'white url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") no-repeat right 12px center/20px 20px',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  marginBottom: 16,
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};
const dropdownFocusStyle = {
  boxShadow: '0 0 0 2px #3498db33, 0 1px 2px rgba(0, 0, 0, 0.05)',
  borderColor: '#3498db',
};

function MultiSelectDropdown({ label, options, selected, onChange, style = {}, projectsData, filterType, selectedProvinces, selectedStatuses, selectedSectors }) {
  // Ensure dropdown is closed initially when the panel appears
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
  const menuRef = useRef(null);
  const [pendingSelected, setPendingSelected] = useState(selected);

  React.useEffect(() => {
    if (open) setPendingSelected(selected);
    function handleClickOutside(event) {
      const target = event.target;
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const insideMenu = menuRef.current && menuRef.current.contains(target);
      if (!insideDropdown && !insideMenu) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, selected]);

  // Update pendingSelected when selected changes
  React.useEffect(() => {
    if (!open) {
      setPendingSelected(selected);
    }
  }, [selected]);
  
  // Position the dropdown menu
  React.useEffect(() => {
    if (open && buttonRef.current && dropdownRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelRect = dropdownRef.current.parentElement?.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12; // 12px margin
      const maxHeight = Math.max(180, Math.min(320, spaceBelow));
      let width = rect.width;
      let left = rect.left + window.scrollX;
      if (panelRect) {
        // Clamp width to panel width
        width = Math.min(width, panelRect.width);
        // If menu would overflow right, shift left
        const overflowRight = left + width - (panelRect.left + panelRect.width);
        if (overflowRight > 0) {
          left -= overflowRight;
        }
        // Prevent menu from going off the left edge
        if (left < panelRect.left) {
          left = panelRect.left;
        }
      }
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left,
        width,
        maxHeight,
      });
    }
  }, [open]);

  const handleCheckboxChange = (value) => {
    if (value === 'All') {
      setPendingSelected(['All']);
    } else {
      setPendingSelected(prev => {
        if (prev.includes(value)) {
          const next = prev.filter(v => v !== value);
          return next.length === 0 ? ['All'] : next;
        } else {
          return prev.filter(v => v !== 'All').concat(value);
        }
      });
    }
  };

  const handleApply = () => {
    onChange(pendingSelected);
    setOpen(false);
  };

  // Helper to get count for each option
  const getOptionCount = (option) => {
    // Build filter context for this dropdown
    let provinces = selectedProvinces;
    let statuses = selectedStatuses;
    let sectors = selectedSectors;
    if (filterType === 'province') provinces = [option];
    if (filterType === 'status') statuses = [option];
    if (filterType === 'sector') sectors = [option];
    return projectsData.filter(project =>
      (provinces.includes('All') || provinces.includes(project.province)) &&
      (statuses.includes('All') || statuses.includes(project.status)) &&
      (sectors.includes('All') || sectors.includes(project.sector))
    ).length;
  };

  return (
    <div style={{ marginBottom: 16, position: 'relative', width: '100%', zIndex: 9998, ...style }} ref={dropdownRef}>
      <div style={{ fontWeight: 'bold', fontSize: 13, color: '#374151', marginBottom: 4 }}>{label}</div>
      <div
        ref={buttonRef}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 10,
          padding: '12px 40px 12px 16px',
          background: 'white url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") no-repeat right 12px center/20px 20px',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          fontSize: 16,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: selected.length === 0 || selected[0] === 'All' ? '#888' : '#2c3e50',
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: selected.length === 0 || selected[0] === 'All' ? '#888' : '#2c3e50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
          {selected.length === 0 || selected[0] === 'All'
            ? `Select ${label.toLowerCase()}...`
            : selected.length <= 2
              ? selected.join(', ')
              : `${selected.slice(0, 2).join(', ')} +${selected.length - 2} more`}
        </span>
      </div>
      {open && typeof window !== 'undefined' && (
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 9999,
              background: '#f9fbfd',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
              width: menuPosition.width,
              maxWidth: '100vw',
              minWidth: 180,
              boxSizing: 'border-box',
              maxHeight: menuPosition.maxHeight,
              overflowY: 'auto',
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#f9fbfd',
              zIndex: 2,
              padding: '12px 16px 8px 16px',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: 'bold',
              fontSize: 14,
              color: '#374151',
              letterSpacing: 0.2,
            }}>{label}</div>
            <div style={{ padding: '8px 0 0 0', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, padding: '0 16px' }}>
                <input
                  type="checkbox"
                  checked={pendingSelected.length === 0 || pendingSelected.includes('All')}
                  onChange={() => handleCheckboxChange('All')}
                  id={`all-${label}`}
                  style={{ accentColor: '#3498db', width: 18, height: 18 }}
                />
                <label htmlFor={`all-${label}`} style={{ marginLeft: 10, fontSize: 15, color: '#222', cursor: 'pointer' }}>All <span style={{ color: '#888', fontWeight: 400 }}>({projectsData.length})</span></label>
              </div>
              {options.filter(opt => opt !== 'All').map(opt => (
                <div
                  key={opt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 4,
                    padding: '0 16px',
                    borderRadius: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#e8f4fd')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={pendingSelected.includes(opt)}
                    onChange={() => handleCheckboxChange(opt)}
                    id={`${label}-${opt}`}
                    style={{ accentColor: '#3498db', width: 18, height: 18 }}
                  />
                  <label htmlFor={`${label}-${opt}`} style={{ marginLeft: 10, fontSize: 15, color: '#222', cursor: 'pointer', flex: 1, whiteSpace: 'pre-wrap' }}>{opt} <span style={{ color: '#888', fontWeight: 400 }}>({getOptionCount(opt)})</span></label>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0 0 0' }} />
            <div style={{
              position: 'sticky',
              bottom: 0,
              background: '#f9fbfd',
              zIndex: 2,
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              boxShadow: '0 -2px 8px rgba(52,152,219,0.07)',
            }}>
              <button
                onClick={handleApply}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 24px',
                  fontSize: 15,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  letterSpacing: 0.2,
                }}
              >
                Apply
              </button>
            </div>
            <style>{`
              div[role='dialog']::-webkit-scrollbar {
                width: 10px;
                background: #f3f4f6;
              }
              div[role='dialog']::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 8px;
              }
            `}</style>
          </div>,
          document.body
        )
      )}
    </div>
  );
}

function AllFilterChips({
  selectedProvinces,
  selectedStatuses,
  selectedSectors,
  selectedYear,
  onRemoveProvince,
  onRemoveStatus,
  onRemoveSector,
  onRemoveYear,
  style = {},
}) {
  const hasFilters = 
    (selectedProvinces.length > 0 && selectedProvinces[0] !== 'All') ||
    (selectedStatuses.length > 0 && selectedStatuses[0] !== 'All') ||
    (selectedSectors.length > 0 && selectedSectors[0] !== 'All') ||
    selectedYear !== 'All';
  
  if (!hasFilters) return null;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, ...style }}>
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: 16, 
        color: '#222', 
        marginBottom: 12,
        textTransform: 'uppercase'
      }}>
        APPLIED FILTERS
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {selectedProvinces[0] !== 'All' && selectedProvinces.map(province => (
          <span
            key={`province-${province}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f2f3',
              color: '#333',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            {province}
            <button
              onClick={() => onRemoveProvince(province)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                marginLeft: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 18,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label={`Remove ${province}`}
            >
              ×
            </button>
          </span>
        ))}
        
        {selectedStatuses[0] !== 'All' && selectedStatuses.map(status => (
          <span
            key={`status-${status}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f2f3',
              color: '#333',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            {status}
            <button
              onClick={() => onRemoveStatus(status)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                marginLeft: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 18,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label={`Remove ${status}`}
            >
              ×
            </button>
          </span>
        ))}
        
        {selectedSectors[0] !== 'All' && selectedSectors.map(sector => (
          <span
            key={`sector-${sector}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f2f3',
              color: '#333',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            {sector}
            <button
              onClick={() => onRemoveSector(sector)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                marginLeft: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 18,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label={`Remove ${sector}`}
            >
              ×
            </button>
          </span>
        ))}

        {selectedYear !== 'All' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f2f3',
              color: '#333',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            {selectedYear}
            <button
              onClick={() => onRemoveYear(selectedYear)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                marginLeft: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 18,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label={`Remove Year ${selectedYear}`}
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  background: '#e3f0fa',
  color: '#2366a8',
  borderRadius: 999,
  padding: '3px 12px 3px 12px',
  fontSize: 14,
  fontWeight: 600,
  marginRight: 0,
  marginBottom: 4,
  boxShadow: '0 1px 4px rgba(52,152,219,0.08)',
  border: '1px solid #b3d9ff',
  letterSpacing: 0.1,
  transition: 'background 0.15s',
};
const chipButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#3498db',
  marginLeft: 8,
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: 15,
  lineHeight: 1,
  borderRadius: 999,
  padding: 0,
  width: 18,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s, color 0.15s',
};

function SingleSelectDropdown({ label, options, selected, onChange, style = {}, projectsData, selectedProvinces, selectedStatuses }) {
  // Ensure dropdown is closed initially when the panel appears
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
  const menuRef = useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const insideMenu = menuRef.current && menuRef.current.contains(target);
      if (!insideDropdown && !insideMenu) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  React.useEffect(() => {
    if (open && buttonRef.current && dropdownRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelRect = dropdownRef.current.parentElement?.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12; // 12px margin
      const maxHeight = Math.max(180, Math.min(320, spaceBelow));
      let width = rect.width;
      let left = rect.left + window.scrollX;
      if (panelRect) {
        // Clamp width to panel width
        width = Math.min(width, panelRect.width);
        // If menu would overflow right, shift left
        const overflowRight = left + width - (panelRect.left + panelRect.width);
        if (overflowRight > 0) {
          left -= overflowRight;
        }
        // Prevent menu from going off the left edge
        if (left < panelRect.left) {
          left = panelRect.left;
        }
      }
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left,
        width,
        maxHeight,
      });
    }
  }, [open]);

  // Helper to get count for each option
  const getOptionCount = (option) => {
    if (option === 'All') return projectsData.filter(project => 
      (selectedProvinces.includes('All') || selectedProvinces.includes(project.province)) &&
      (selectedStatuses.includes('All') || selectedStatuses.includes(project.status))
    ).length;
    
    if (label === 'Sector') {
      return projectsData.filter(project => 
        (selectedProvinces.includes('All') || selectedProvinces.includes(project.province)) &&
        (selectedStatuses.includes('All') || selectedStatuses.includes(project.status)) &&
        project.sector === option
      ).length;
    } else if (label === 'Year') {
      // Extract year from project.year for comparison
      return projectsData.filter(project => {
        const projectYear = project.year ? 
          project.year.includes('-') ? 
            project.year.split('-')[0] : 
            project.year 
          : '';
        return (selectedProvinces.includes('All') || selectedProvinces.includes(project.province)) &&
          (selectedStatuses.includes('All') || selectedStatuses.includes(project.status)) &&
          projectYear === option;
      }).length;
    }
    return 0;
  };

  const handleSelect = (value) => {
    onChange(value);
    setOpen(false);
  };

  // Determine if we should show the indicator dot
  const shouldShowIndicator = (option) => {
    // Only show indicators for status options, not for year or sector
    return label === 'Status' && option !== 'All';
  };

  // Render the dropdown menu directly in the component tree
  const renderDropdownMenu = () => {
    if (!open) return null;
    
    return (
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          maxHeight: menuPosition.maxHeight,
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: 8,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          zIndex: 9999,
        }}
      >
        {options.map((option) => {
          const count = getOptionCount(option);
          return (
            <div
              key={option}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: option === selected ? '#f1f5f9' : 'white',
                borderBottom: '1px solid #f1f5f9',
              }}
              onClick={() => handleSelect(option)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = option === selected ? '#f1f5f9' : '#f9fafb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = option === selected ? '#f1f5f9' : 'white';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {shouldShowIndicator(option) && (
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#3498db',
                  }} />
                )}
                <span>{option}</span>
              </div>
              <span style={{ color: '#6b7280', fontSize: 14 }}>({count})</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 16, position: 'relative', width: '100%', zIndex: 9998, ...style }} ref={dropdownRef}>
      <div style={{ fontWeight: 'bold', fontSize: 13, color: '#374151', marginBottom: 4 }}>{label}</div>
      <div
        ref={buttonRef}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 10,
          padding: '12px 40px 12px 16px',
          background: 'white url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") no-repeat right 12px center/20px 20px',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          fontSize: 16,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: '#2c3e50',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {shouldShowIndicator(selected) && (
            <div style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#3498db',
              marginRight: 4,
            }} />
          )}
          <span>{selected}</span>
          {selected === 'All' && (
            <span style={{ color: '#6b7280', marginLeft: 4 }}>({getOptionCount('All')})</span>
          )}
        </div>
      </div>
      {typeof document !== 'undefined' && renderDropdownMenu()}
    </div>
  );
}

// Add a reusable FilterChip component at the top of the file
function FilterChip({ label, onRemove }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#f0f0f0',
        color: '#333333',
        borderRadius: 4,
        padding: '8px 12px',
        fontSize: 16,
        fontWeight: 400,
        marginBottom: 4,
        marginRight: 0,
        position: 'relative',
      }}
    >
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        style={{
          background: 'none',
          border: 'none',
          color: '#333',
          marginRight: 8,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
      <span>{label}</span>
    </span>
  );
}

// Add a ChipsBar component for unified chips rendering
function ChipsBar({
  provinces, statuses, sectors, year, onRemoveProvince, onRemoveStatus, onRemoveSector, onRemoveYear
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
        minHeight: 36,
        marginBottom: 8,
        marginLeft: 24,
        marginTop: 10, // Add space above chips
      }}
    >
      {year && year !== 'All' && (
        <FilterChip label={year} onRemove={() => onRemoveYear('All')} />
      )}
      {statuses.filter(s => s !== 'All').map(status => (
        <FilterChip key={status} label={status} onRemove={() => onRemoveStatus(status)} />
      ))}
      {provinces.filter(p => p !== 'All').map(province => (
        <FilterChip key={province} label={province} onRemove={() => onRemoveProvince(province)} />
      ))}
      {sectors.filter(s => s !== 'All').map(sector => (
        <FilterChip key={sector} label={sector} onRemove={() => onRemoveSector(sector)} />
      ))}
    </div>
  );
}

export const FiltersPanel = (props) => {
  const appliedFiltersLabelStyle = {
    fontWeight: 700, // Make bold
    color: '#000',
    fontSize: 14,
    marginRight: 8,
    marginBottom: 14,
    marginTop: -6,
    marginLeft: 12, // Move more to the left
    display: 'block',
  };
  const hasActiveFilters = props.selectedProvinces[0] !== 'All' || props.selectedStatuses[0] !== 'All' || props.selectedSectors[0] !== 'All' || props.selectedYear !== 'All';

  // State for pending filter selections
  const [pendingProvinces, setPendingProvinces] = useState(props.selectedProvinces);
  const [pendingStatuses, setPendingStatuses] = useState(props.selectedStatuses);
  const [pendingSectors, setPendingSectors] = useState(props.selectedSectors);
  const [pendingYear, setPendingYear] = useState(props.selectedYear);

  // Check if there are pending changes
  const hasPendingChanges = 
    JSON.stringify(pendingProvinces) !== JSON.stringify(props.selectedProvinces) ||
    JSON.stringify(pendingStatuses) !== JSON.stringify(props.selectedStatuses) ||
    JSON.stringify(pendingSectors) !== JSON.stringify(props.selectedSectors) ||
    pendingYear !== props.selectedYear;

  // Apply pending changes
  const applyFilters = () => {
    props.onProvinceChange(pendingProvinces);
    props.onStatusChange(pendingStatuses);
    if (pendingSectors[0] !== props.selectedSectors[0]) {
      props.onSectorChange(pendingSectors[0]);
    }
    if (pendingYear !== props.selectedYear) {
      props.onYearChange(pendingYear);
    }
    if (props.onClose) {
      props.onClose();
    }
  };

  // Reset pending changes to current selections
  const resetPendingChanges = () => {
    setPendingProvinces(props.selectedProvinces);
    setPendingStatuses(props.selectedStatuses);
    setPendingSectors(props.selectedSectors);
    setPendingYear(props.selectedYear);
  };

  // Update pending selections when actual selections change
  useEffect(() => {
    setPendingProvinces(props.selectedProvinces);
    setPendingStatuses(props.selectedStatuses);
    setPendingSectors(props.selectedSectors);
    setPendingYear(props.selectedYear);
  }, [props.selectedProvinces, props.selectedStatuses, props.selectedSectors, props.selectedYear]);

  // Helper function to count projects for each filter option
  const getOptionCount = (option, filterType) => {
    let year = pendingYear;
    let statuses = pendingStatuses;
    let provinces = pendingProvinces;
    let sectors = pendingSectors;
    if (filterType === 'year') year = option;
    if (filterType === 'status') statuses = [option];
    if (filterType === 'province') provinces = [option];
    if (filterType === 'sector') sectors = [option];
    return props.projectsData.filter(project => {
      const provinceMatch = provinces.includes('All') || provinces.includes(project.province);
      const statusMatch = statuses.includes('All') || statuses.includes(project.status);
      const sectorMatch = sectors.includes('All') || sectors.includes(project.sector);
      const projectYear = project.year ? 
        project.year.includes('-') ? 
          project.year.split('-')[0] : 
          project.year 
        : '';
      const yearMatch = year === 'All' || year === projectYear;
      return provinceMatch && statusMatch && sectorMatch && yearMatch;
    }).length;
  };

  // Local handlers for pending selections
  const handlePendingStatusChange = (status) => {
    if (status === 'All') {
      setPendingStatuses(['All']);
    } else {
      setPendingStatuses(prev => {
        if (prev.includes(status)) {
          const next = prev.filter(s => s !== status);
          return next.length === 0 ? ['All'] : next;
        } else {
          const next = prev[0] === 'All' ? [status] : [...prev, status];
          return next;
        }
      });
    }
  };

  const handlePendingProvinceChange = (province) => {
    if (province === 'All') {
      setPendingProvinces(['All']);
    } else {
      setPendingProvinces(prev => {
        if (prev.includes(province)) {
          const next = prev.filter(p => p !== province);
          return next.length === 0 ? ['All'] : next;
        } else {
          const next = prev[0] === 'All' ? [province] : [...prev, province];
          return next;
        }
      });
    }
  };

  const handlePendingSectorChange = (sector) => {
    const newSector = sector === 'All' ? 'All' : sector;
    const shouldReset = props.selectedSectors.length === 1 && props.selectedSectors[0] === sector;
    setPendingSectors(shouldReset ? ['All'] : [newSector]);
  };

  const handlePendingYearChange = (year) => {
    setPendingYear(year);
  };

  // Compute the total count of projects matching the pending filters
  const filteredCount = props.projectsData.filter(project => {
    const provinceMatch = pendingProvinces.includes('All') || pendingProvinces.includes(project.province);
    const statusMatch = pendingStatuses.includes('All') || pendingStatuses.includes(project.status);
    const sectorMatch = pendingSectors.includes('All') || pendingSectors.includes(project.sector);
    const projectYear = project.year ?
      project.year.includes('-') ?
        project.year.split('-')[0] :
        project.year
      : '';
    const yearMatch = pendingYear === 'All' || pendingYear === projectYear;
    return provinceMatch && statusMatch && sectorMatch && yearMatch;
  }).length;

  // --- Panel content as a function for reuse ---
  const panelContent = (
    <>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 16,
        paddingTop: 0,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: '#f9fbfd',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        minHeight: 64,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '100%' }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#000000', lineHeight: '32px' }}>
            Filter & Sort
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {(hasActiveFilters || hasPendingChanges) && (
            <button onClick={props.onClearFilters} style={{padding: '2px 6px', background: 'none', border: 'none', color: '#777', fontSize: 16, textDecoration: 'underline', cursor: 'pointer'}}>
              Clear All
            </button>
          )}
          <button 
            onClick={props.onClose} 
            style={{
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 20,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
            }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Only show filter chips section when there are active filters */}
      {hasActiveFilters && !hasPendingChanges && (
        <div
          style={{
            paddingHorizontal: 16,
            marginBottom: 16,
            paddingTop: 16,
            paddingBottom: 16,
            borderBottom: '1px solid #f0f0f0',
            background: 'rgba(249,251,253,0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <span style={appliedFiltersLabelStyle}>APPLIED FILTERS:</span>
          <ChipsBar
            provinces={props.selectedProvinces}
            statuses={props.selectedStatuses}
            sectors={props.selectedSectors}
            year={props.selectedYear}
            onRemoveProvince={province => props.onProvinceChange(props.selectedProvinces.filter(p => p !== province).length === 0 ? ['All'] : props.selectedProvinces.filter(p => p !== province))}
            onRemoveStatus={status => props.onStatusChange(props.selectedStatuses.filter(s => s !== status).length === 0 ? ['All'] : props.selectedStatuses.filter(s => s !== status))}
            onRemoveSector={props.onSectorChange}
            onRemoveYear={props.onYearChange}
          />
        </div>
      )}

      {/* Pending Selections */}
      {hasPendingChanges && (
        <div style={{ 
          paddingHorizontal: 16, 
          marginBottom: 16,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <span style={appliedFiltersLabelStyle}>APPLIED FILTERS:</span>
          <ChipsBar
            provinces={pendingProvinces}
            statuses={pendingStatuses}
            sectors={pendingSectors}
            year={pendingYear}
            onRemoveProvince={handlePendingProvinceChange}
            onRemoveStatus={handlePendingStatusChange}
            onRemoveSector={handlePendingSectorChange}
            onRemoveYear={handlePendingYearChange}
          />
        </div>
      )}

      {/* Rest of the filters panel content - scrollable area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        borderTop: '1px solid #e5e7eb', // Add separator
        marginTop: 0, // Remove spacing since header is now sticky and flush
      }}>
          {/* Year Filter - Single-select without checkbox */}
          <div style={{
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
          }}>
            <Collapsible title="Year" defaultOpen={false}>
              <div style={{ 
                padding: 12,
                paddingLeft: 12,
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {props.years.map((year) => (
                  <label
                    key={year}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 8,
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'background-color 0.2s',
                      backgroundColor: pendingYear === year ? '#f0f7ff' : 'white',
                      borderLeft: pendingYear === year ? '3px solid #3498db' : '3px solid transparent',
                      marginBottom: 4,
                    }}
                    onMouseOver={e => { if (pendingYear !== year) e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                    onMouseOut={e => { if (pendingYear !== year) e.currentTarget.style.backgroundColor = 'white' }}
                    onClick={() => handlePendingYearChange(year)}
                  >
                    <span style={{ color: '#111827', flex: 1 }}>{year}</span>
                    <span style={{ 
                      color: '#444', 
                      fontSize: '12px', 
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      marginLeft: '8px'
                    }}>
                      {getOptionCount(year, 'year')}
                    </span>
                  </label>
                ))}
              </div>
            </Collapsible>
          </div>
          {/* Status Filter - Multi-select with checkboxes */}
          <div style={{
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
          }}>
            <Collapsible title="Status" defaultOpen={false}>
              <div style={{ 
                padding: 12,
                paddingLeft: 12,
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {props.statuses.map((status) => (
                  <label
                    key={status}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 8,
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'background-color 0.2s',
                      backgroundColor: pendingStatuses.includes(status) ? '#f0f7ff' : 'white',
                      borderLeft: pendingStatuses.includes(status) ? '3px solid #3498db' : '3px solid transparent',
                      marginBottom: 4,
                    }}
                    onMouseOver={e => { if (!pendingStatuses.includes(status)) e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                    onMouseOut={e => { if (!pendingStatuses.includes(status)) e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    <input
                      type="checkbox"
                      checked={pendingStatuses.includes(status)}
                      onChange={() => handlePendingStatusChange(status)}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ color: '#111827', flex: 1 }}>{status}</span>
                    <span style={{ 
                      color: '#444', 
                      fontSize: '12px', 
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      marginLeft: '8px'
                    }}>
                      {getOptionCount(status, 'status')}
                    </span>
                  </label>
                ))}
              </div>
            </Collapsible>
          </div>
          {/* Province Filter - Multi-select with checkboxes */}
          <div style={{
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
          }}>
            <Collapsible title="Province" defaultOpen={false}>
              <div style={{ 
                padding: 12,
                paddingLeft: 12,
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {props.provinces.map((province) => (
                  <label
                    key={province}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 8,
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'background-color 0.2s',
                      backgroundColor: pendingProvinces.includes(province) ? '#f0f7ff' : 'white',
                      borderLeft: pendingProvinces.includes(province) ? '3px solid #3498db' : '3px solid transparent',
                      marginBottom: 4,
                    }}
                    onMouseOver={e => { if (!pendingProvinces.includes(province)) e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                    onMouseOut={e => { if (!pendingProvinces.includes(province)) e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    <input
                      type="checkbox"
                      checked={pendingProvinces.includes(province)}
                      onChange={() => handlePendingProvinceChange(province)}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ color: '#111827', flex: 1 }}>{province}</span>
                    <span style={{ 
                      color: '#444', 
                      fontSize: '12px', 
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      marginLeft: '8px'
                    }}>
                      {getOptionCount(province, 'province')}
                    </span>
                  </label>
                ))}
              </div>
            </Collapsible>
          </div>
          {/* Sector Filter - Single-select without checkbox */}
          <div style={{
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
          }}>
            <Collapsible title="Sector" defaultOpen={false}>
              <div style={{ 
                padding: 12,
                paddingLeft: 12,
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {props.sectors.map((sector) => (
                  <label
                    key={sector}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 8,
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'background-color 0.2s',
                      backgroundColor: pendingSectors.includes(sector) ? '#f0f7ff' : 'white',
                      borderLeft: pendingSectors.includes(sector) ? '3px solid #3498db' : '3px solid transparent',
                      marginBottom: 4,
                    }}
                    onMouseOver={e => { if (!pendingSectors.includes(sector)) e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                    onMouseOut={e => { if (!pendingSectors.includes(sector)) e.currentTarget.style.backgroundColor = 'white' }}
                    onClick={() => handlePendingSectorChange(sector)}
                  >
                    <span style={{ color: '#111827', flex: 1 }}>{sector}</span>
                    <span style={{ 
                      color: '#444', 
                      fontSize: '12px', 
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      marginLeft: '8px'
                    }}>
                      {getOptionCount(sector, 'sector')}
                    </span>
                  </label>
                ))}
              </div>
            </Collapsible>
          </div>
        </div>

      {/* Apply Button - Only show when there are pending changes */}
      {hasPendingChanges && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          zIndex: 10, // Ensure it stays on top
        }}>
          <button
            onClick={resetPendingChanges}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f9fafb' }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white' }}
          >
            Cancel
          </button>
          <button
            onClick={applyFilters}
            style={{
              padding: '8px 16px',
              border: '1px solid #3498db',
              borderRadius: '6px',
              backgroundColor: '#3498db',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#2980b9' }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#3498db' }}
          >
            {`Apply Filters (${filteredCount})`}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 320,
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 999,
        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ backgroundColor: 'white', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {panelContent}
      </div>
    </div>
  );
};

export default FiltersPanel; 