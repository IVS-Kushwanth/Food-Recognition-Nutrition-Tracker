import React from 'react';
import { Award, Info, ChevronRight, AlertOctagon } from 'lucide-react';

export default function TopPredictions({ predictions, onSelectPrediction, selectedKey, isUnknown }) {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award style={{ width: '20px', height: '20px', color: '#6366f1' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Top-5 ML Predictions</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
          Softmax Probabilities
        </span>
      </div>

      {isUnknown && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '14px',
          color: '#f87171',
          fontSize: '0.82rem'
        }}>
          <AlertOctagon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>Low Confidence Alert: Model confidence is below 35%. The image may not belong to the 12 trained categories or contains an unknown dish.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {predictions.map((pred, idx) => {
          const isTop = idx === 0;
          const isSelected = selectedKey === pred.food_key;
          const percent = (pred.confidence * 100).toFixed(1);

          return (
            <div
              key={pred.food_key}
              onClick={() => onSelectPrediction && onSelectPrediction(pred)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.06)'}`,
                cursor: onSelectPrediction ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: isTop ? '#6366f1' : 'rgba(255,255,255,0.08)',
                    color: isTop ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                    {pred.food_name}
                  </span>
                  {isTop && (
                    <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      Primary
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem', color: isTop ? '#818cf8' : '#94a3b8' }}>
                    {percent}%
                  </span>
                  {onSelectPrediction && (
                    <ChevronRight style={{ width: '14px', height: '14px', color: '#64748b' }} />
                  )}
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percent}%`,
                    backgroundColor: isTop ? '#6366f1' : '#475569',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.74rem', color: '#64748b' }}>
        <Info style={{ width: '14px', height: '14px', flexShrink: 0 }} />
        <span>Inference confidence reflects MobileNetV3 visual classification probability, distinct from nutritional estimation accuracy.</span>
      </div>
    </div>
  );
}
