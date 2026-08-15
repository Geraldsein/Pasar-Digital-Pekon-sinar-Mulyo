import React from 'react';

const LoadingSkeleton = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15, 44, 89, 0.08)'
      }}>
        <div style={{ height: '200px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite' }} />
        <div style={{ padding: '16px' }}>
          <div style={{ height: '20px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', marginBottom: '12px', width: '60%' }} />
          <div style={{ height: '16px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', marginBottom: '12px', width: '40%' }} />
          <div style={{ height: '16px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', marginBottom: '12px' }} />
          <div style={{ height: '40px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', borderRadius: '8px', marginTop: '16px' }} />
        </div>
      </div>
    );
  }
  
  if (type === 'list') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        marginBottom: '12px'
      }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', borderRadius: '8px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '20px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', marginBottom: '8px', width: '50%' }} />
          <div style={{ height: '16px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', width: '70%' }} />
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      height: '20px',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'pulse 1.5s infinite',
      borderRadius: '4px',
      marginBottom: '8px'
    }} />
  );
};

export default LoadingSkeleton;