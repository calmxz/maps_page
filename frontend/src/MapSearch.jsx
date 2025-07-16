import React, { useState, useRef, useEffect } from 'react';

const MapSearchBox = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  suggestions,
  onSuggestionClick,
  placeholder = "Search projects...",
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
      const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleKeyPress = (event) => {
    if (!showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onSuggestionClick(suggestions[highlightedIndex]);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const getMarkerColor = (status) => {
    const colors = {
      'Ongoing': '#ffaa00',
      'Completed': '#22c55e',
      'Planning': '#3b82f6',
      'Cancelled': '#ef4444',
      'Processing': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(searchQuery.length > 0)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px',
            paddingRight: searchQuery ? '64px' : '40px', // enough space for clear and icon
            fontSize: '16px',
            color: '#333333',
            outline: 'none',
            boxSizing: 'border-box',
            background: 'transparent',
            border: 'none',
            borderRadius: 0
          }}
        />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            style={{
              position: 'absolute',
              right: '40px', // just left of the icon
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666666',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        )}
        <div style={{
          position: 'absolute',
          right: '12px', // move icon to right
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#666666',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          🔍
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          maxHeight: '300px',
          overflow: 'auto',
          zIndex: 1000,
          marginTop: '4px'
        }}>
            {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.project_no}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '10px 16px',
                backgroundColor: index === highlightedIndex ? '#f3f4f6' : '#fff',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              >
              <div style={{
                fontSize: '16px',
                color: '#222',
                fontWeight: '600',
                lineHeight: '22px'
              }}>
                {suggestion.title}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '6px'
              }}>
                <span style={{
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  color: 'white',
                        backgroundColor: getMarkerColor(suggestion.status),
                  fontWeight: '500',
                  marginRight: '8px'
                }}>
                  {suggestion.status}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  {suggestion.firm_name}
                </span>
              </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MapSearchBox; 