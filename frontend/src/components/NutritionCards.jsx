import React from 'react';
import { Flame, Beef, Wheat, Droplets, Leaf, ShieldCheck, Database } from 'lucide-react';

export default function NutritionCards({ nutritionData, servingWeightG, foodName, source }) {
  if (!nutritionData) return null;

  const nutrients = nutritionData.nutrients || nutritionData.calculated_nutrition?.nutrients || nutritionData;
  const per100g = nutritionData.per_100g || nutritionData.food_info?.nutrition_per_100g || {};
  const dailyValues = nutritionData.daily_values_percent || nutritionData.daily_value_percentages || {};

  const cards = [
    {
      key: 'calories',
      label: 'Calories',
      val: nutrients.calories_kcal ?? nutritionData.total_calories_kcal ?? nutritionData.calories_kcal ?? 0,
      unit: 'kcal',
      per100: per100g.calories_kcal ?? 0,
      dv: dailyValues.calories,
      color: 'var(--macro-cals)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      icon: Flame,
    },
    {
      key: 'protein',
      label: 'Protein',
      val: nutrients.protein_g ?? nutritionData.protein_g ?? 0,
      unit: 'g',
      per100: per100g.protein_g ?? 0,
      dv: dailyValues.protein,
      color: 'var(--macro-protein)',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      icon: Beef,
    },
    {
      key: 'carbohydrates',
      label: 'Carbohydrates',
      val: nutrients.carbohydrates_g ?? nutritionData.carbohydrates_g ?? 0,
      unit: 'g',
      per100: per100g.carbs_g ?? per100g.carbohydrates_g ?? 0,
      dv: dailyValues.carbohydrates,
      color: 'var(--macro-carbs)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.25)',
      icon: Wheat,
    },
    {
      key: 'fat',
      label: 'Fat',
      val: nutrients.fat_g ?? nutritionData.fat_g ?? 0,
      unit: 'g',
      per100: per100g.fat_g ?? 0,
      dv: dailyValues.fat,
      color: 'var(--macro-fat)',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
      icon: Droplets,
    },
    {
      key: 'fiber',
      label: 'Fiber',
      val: nutrients.fiber_g ?? nutritionData.fiber_g ?? 0,
      unit: 'g',
      per100: per100g.fiber_g ?? 0,
      dv: dailyValues.fiber,
      color: 'var(--macro-fiber)',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
      icon: Leaf,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header bar with Dish Name & Source */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              {foodName || nutritionData.food_name || 'Nutritional Profile'}
            </h3>
            <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
              {nutritionData.category || 'Main Dish'}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Proportionately calculated for <strong>{servingWeightG}g</strong> serving using verified composition tables.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <Database style={{ width: '14px', height: '14px' }} />
          <span>Source: <strong>{source || nutritionData.source || 'IFCT 2017'}</strong></span>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {cards.map((c) => {
          const IconComponent = c.icon;
          return (
            <div
              key={c.key}
              className="glass-panel"
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: c.bgColor,
                border: `1px solid ${c.borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>{c.label}</span>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: c.color
                }}>
                  <IconComponent style={{ width: '16px', height: '16px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                    {typeof c.val === 'number' ? c.val.toFixed(1) : c.val}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>{c.unit}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>{c.per100} {c.unit} / 100g</span>
                  {c.dv !== undefined && (
                    <span style={{ color: c.color, fontWeight: 700 }}>
                      {c.dv}% DV
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Micronutrients (Sugar, Sodium, Water) */}
      {(nutrients.sugar_g !== undefined || nutrients.sodium_mg !== undefined || nutrients.water_g !== undefined) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.82rem',
          color: '#cbd5e1'
        }}>
          <span style={{ fontWeight: 600, color: '#94a3b8' }}>Additional Nutrients:</span>
          {nutrients.sugar_g !== undefined && (
            <span>Sugar: <strong style={{ color: '#ffffff' }}>{nutrients.sugar_g}g</strong> ({dailyValues.sugar ?? 0}% DV)</span>
          )}
          {nutrients.sodium_mg !== undefined && (
            <span>• Sodium: <strong style={{ color: '#ffffff' }}>{nutrients.sodium_mg}mg</strong> ({dailyValues.sodium ?? 0}% DV)</span>
          )}
          {nutrients.water_g !== undefined && (
            <span>• Water Moisture: <strong style={{ color: '#ffffff' }}>{nutrients.water_g}g</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
