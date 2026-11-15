import React, { useState, useEffect } from 'react';
import { Scale, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

const PRESET_PORTIONS = [100, 150, 200, 250, 350, 500];

export default function PortionController({
  servingWeightG,
  onServingChange,
  onRecalculate,
  recalculating,
  estimatedWeightG,
  portionDetails
}) {
  const [localGrams, setLocalGrams] = useState(servingWeightG || 250);

  useEffect(() => {
    if (servingWeightG) {
      setLocalGrams(servingWeightG);
    }
  }, [servingWeightG]);

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setLocalGrams(val);
    onServingChange(val);
  };

  const handleInputChange = (e) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= 10 && val <= 2000) {
      setLocalGrams(val);
      onServingChange(val);
    } else {
      setLocalGrams(e.target.value);
    }
  };

  const handlePreset = (grams) => {
    setLocalGrams(grams);
    onServingChange(grams);
    onRecalculate(grams);
  };

  return (
    <div className="glass-panel" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale style={{ width: '20px', height: '20px', color: '#6366f1' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Portion & Serving Size Adjustment</h4>
        </div>

        {estimatedWeightG && (
          <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>
            Nutrition5k ML Estimate: {estimatedWeightG}g
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Slider & Number Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={typeof localGrams === 'number' ? localGrams : 250}
              onChange={handleSliderChange}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
              <span>50g (Snack)</span>
              <span>250g (Standard)</span>
              <span>500g (Large)</span>
              <span>1000g</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="10"
              max="2000"
              className="input-text"
              style={{ width: '100px', padding: '8px 12px', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace' }}
              value={localGrams}
              onChange={handleInputChange}
            />
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>grams</span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onRecalculate(localGrams)}
            disabled={recalculating}
            style={{ padding: '9px 18px', fontSize: '0.88rem' }}
          >
            <RefreshCw className={recalculating ? 'animate-spin' : ''} style={{ width: '16px', height: '16px' }} />
            <span>Recalculate</span>
          </button>
        </div>

        {/* Preset quick buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Preset Servings:</span>
          {PRESET_PORTIONS.map((grams) => (
            <button
              key={grams}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handlePreset(grams)}
              style={{
                backgroundColor: localGrams === grams ? 'rgba(99, 102, 241, 0.25)' : undefined,
                borderColor: localGrams === grams ? '#6366f1' : undefined,
                color: localGrams === grams ? '#a5b4fc' : undefined,
                padding: '4px 10px',
                fontSize: '0.78rem'
              }}
            >
              {grams}g {grams === 100 ? '(Ref / 100g)' : grams === 250 ? '(Standard)' : ''}
            </button>
          ))}
        </div>

        {/* Portion Uncertainty Warning Box */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          color: '#fbbf24',
          fontSize: '0.78rem',
          lineHeight: 1.45
        }}>
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Serving Weight Uncertainty:</strong> Single RGB photographs lack depth/volumetric geometry. Estimated mass ({estimatedWeightG || 250}g) uses dish bulk density ({portionDetails?.density_g_cm3 || 0.85} g/cm³) and 2D plate coverage calibrated on Nutrition5k. Adjust the gram value above for exact proportional calculation.
          </div>
        </div>
      </div>
    </div>
  );
}
