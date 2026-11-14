import React from 'react';
import { PieChart } from 'lucide-react';

export default function MacroChart({ nutritionData }) {
  if (!nutritionData) return null;

  const nutrients = nutritionData.nutrients || nutritionData.calculated_nutrition?.nutrients || nutritionData;
  const energy = nutritionData.energy_breakdown_percent || {};

  const protein = nutrients.protein_g ?? nutritionData.protein_g ?? 0;
  const carbs = nutrients.carbohydrates_g ?? nutritionData.carbohydrates_g ?? 0;
  const fat = nutrients.fat_g ?? nutritionData.fat_g ?? 0;

  const proteinKcal = (protein * 4).toFixed(0);
  const carbsKcal = (carbs * 4).toFixed(0);
  const fatKcal = (fat * 9).toFixed(0);
  const totalMacroCals = Math.max(Number(proteinKcal) + Number(carbsKcal) + Number(fatKcal), 0.1);

  const proteinPct = energy.protein_percent ?? Math.round((Number(proteinKcal) / totalMacroCals) * 100);
  const carbsPct = energy.carbohydrates_percent ?? Math.round((Number(carbsKcal) / totalMacroCals) * 100);
  const fatPct = energy.fat_percent ?? Math.max(0, 100 - proteinPct - carbsPct);
  const totalCals = (nutrients.calories_kcal ?? nutritionData.total_calories_kcal ?? nutritionData.calories_kcal ?? totalMacroCals).toFixed(0);

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Offsets for 3 segments
  const proteinStroke = (proteinPct / 100) * circumference;
  const carbsStroke = (carbsPct / 100) * circumference;
  const fatStroke = (fatPct / 100) * circumference;

  const proteinOffset = 0;
  const carbsOffset = -proteinStroke;
  const fatOffset = -(proteinStroke + carbsStroke);

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <PieChart style={{ width: '18px', height: '18px', color: '#6366f1' }} />
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Macronutrient Energy Distribution</h4>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="14"
            />
            {/* Protein segment */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="14"
              strokeDasharray={`${proteinStroke} ${circumference}`}
              strokeDashoffset={proteinOffset}
              strokeLinecap="round"
            />
            {/* Carbs segment */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="14"
              strokeDasharray={`${carbsStroke} ${circumference}`}
              strokeDashoffset={carbsOffset}
              strokeLinecap="round"
            />
            {/* Fat segment */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="14"
              strokeDasharray={`${fatStroke} ${circumference}`}
              strokeDashoffset={fatOffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Center text */}
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {totalCals}
            </span>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              Total kcal
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
          {/* Protein */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>Protein (4 kcal/g)</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                {proteinPct}%
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>({proteinKcal} kcal)</span>
            </div>
          </div>

          {/* Carbs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>Carbs (4 kcal/g)</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>
                {carbsPct}%
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>({carbsKcal} kcal)</span>
            </div>
          </div>

          {/* Fat */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>Fat (9 kcal/g)</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>
                {fatPct}%
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>({fatKcal} kcal)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
