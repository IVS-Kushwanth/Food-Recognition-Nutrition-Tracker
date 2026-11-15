import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import MatchBanner from '../components/MatchBanner';
import TopPredictions from '../components/TopPredictions';
import NutritionCards from '../components/NutritionCards';
import MacroChart from '../components/MacroChart';
import PortionController from '../components/PortionController';
import CoaTelemetryPanel from '../components/CoaTelemetryPanel';
import { api } from '../services/api';
import { Sparkles, AlertCircle, ArrowLeft, Layers } from 'lucide-react';

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);

  // Core Analysis State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentServingGrams, setCurrentServingGrams] = useState(250);
  const [activeFoodKey, setActiveFoodKey] = useState(null);
  const [activeFoodName, setActiveFoodName] = useState(null);
  const [activeSelectionSource, setActiveSelectionSource] = useState('image'); // 'image' or 'user'

  const handleAnalyze = async (imageFile, foodName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeFood(imageFile, foodName);
      setAnalysisResult(data);
      setCurrentServingGrams(data.portion?.serving_weight_g || 250);
      setActiveFoodKey(data.food_key || data.top_prediction?.food_key);
      setActiveFoodName(data.food_name || data.top_prediction?.food_name);
      setActiveSelectionSource(data.match?.is_match ? 'match' : 'image');
    } catch (err) {
      console.error('Analysis error:', err);
      const detail = err.response?.data?.detail || err.message || 'Analysis failed. Check backend connection.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (grams) => {
    if (!activeFoodKey) return;
    setRecalculating(true);
    try {
      const res = await api.recalculateNutrition(activeFoodKey, grams);
      // Update nutrition data and COA metrics
      setAnalysisResult((prev) => ({
        ...prev,
        nutrition: {
          ...prev.nutrition,
          nutrients: res.nutrients,
          per_100g: res.per_100g,
          daily_values_percent: res.daily_values_percent,
          energy_breakdown_percent: res.energy_breakdown_percent,
          serving_weight_g: res.serving_weight_g,
          source: res.source
        },
        portion: {
          ...prev.portion,
          serving_weight_g: res.serving_weight_g
        },
        coa_metrics: {
          ...prev.coa_metrics,
          cache_status: res.cache_lookup?.status,
          cache_lookup_ms: res.cache_lookup?.latency_ms,
          db_lookup_saved: res.cache_lookup?.saved_db_query
        }
      }));
      setCurrentServingGrams(grams);
    } catch (err) {
      console.error('Recalculation error:', err);
      setError('Failed to recalculate nutrition for this portion.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSelectFoodAlternative = async (sourceType, chosenKey, chosenName) => {
    setActiveSelectionSource(sourceType);
    setActiveFoodKey(chosenKey);
    setActiveFoodName(chosenName);
    setRecalculating(true);
    try {
      const res = await api.recalculateNutrition(chosenKey, currentServingGrams);
      setAnalysisResult((prev) => ({
        ...prev,
        food_key: chosenKey,
        food_name: chosenName,
        nutrition: {
          ...prev.nutrition,
          nutrients: res.nutrients,
          per_100g: res.per_100g,
          daily_values_percent: res.daily_values_percent,
          energy_breakdown_percent: res.energy_breakdown_percent,
          serving_weight_g: res.serving_weight_g,
          source: res.source,
          food_name: res.food_name,
          category: res.category
        },
        coa_metrics: {
          ...prev.coa_metrics,
          cache_status: res.cache_lookup?.status,
          cache_lookup_ms: res.cache_lookup?.latency_ms,
          db_lookup_saved: res.cache_lookup?.saved_db_query
        }
      }));
    } catch (err) {
      console.error('Failed to switch food alternative:', err);
      setError(`Nutrition data for "${chosenName}" is not available in database.`);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSelectPredictionFromList = (pred) => {
    handleSelectFoodAlternative('prediction_list', pred.food_key, pred.food_name);
  };

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Page Title & Hero */}
      <div style={{ marginBottom: '28px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '12px' }}>
          <Sparkles style={{ width: '15px', height: '15px', color: '#818cf8' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Academic Computer Vision & COA System
          </span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Food Recognition & Nutrition Tracker
        </h1>
        <p style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '10px' }}>
          Fine-tuned MobileNetV3 image classification, intelligent text-image verification, IFCT 2017 & USDA nutrition database, and real-time CPU memory hierarchy telemetry.
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171',
          marginBottom: '24px'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.9rem' }}>{error}</div>
          <button
            onClick={() => setError(null)}
            className="btn btn-secondary btn-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Upload & Inputs on Left, Results & Nutrition on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: analysisResult ? 'minmax(320px, 420px) 1fr' : 'minmax(320px, 680px)',
        justifyContent: 'center',
        gap: '24px'
      }}>
        {/* Left Column: Input Panel & Predictions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ImageUploader onAnalyze={handleAnalyze} loading={loading} />

          {analysisResult && (
            <TopPredictions
              predictions={analysisResult.predictions}
              selectedKey={activeFoodKey}
              onSelectPrediction={handleSelectPredictionFromList}
              isUnknown={analysisResult.is_unknown}
            />
          )}
        </div>

        {/* Right Column: Analysis Results, Nutrition Dashboard, COA */}
        {analysisResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Match Status Banner */}
            <MatchBanner
              matchResult={analysisResult.match}
              onSelectFood={handleSelectFoodAlternative}
              activeSelection={activeSelectionSource}
            />

            {/* Nutrition Cards */}
            <NutritionCards
              nutritionData={analysisResult.nutrition}
              servingWeightG={currentServingGrams}
              foodName={activeFoodName}
              source={analysisResult.nutrition?.source}
            />

            {/* Macro Donut & Portion Slider Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <MacroChart nutritionData={analysisResult.nutrition} />

              <PortionController
                servingWeightG={currentServingGrams}
                onServingChange={(g) => setCurrentServingGrams(g)}
                onRecalculate={handleRecalculate}
                recalculating={recalculating}
                estimatedWeightG={analysisResult.portion?.estimated_weight_g}
                portionDetails={analysisResult.portion}
              />
            </div>

            {/* COA Telemetry Panel */}
            <CoaTelemetryPanel coaMetrics={analysisResult.coa_metrics} />
          </div>
        )}
      </div>
    </div>
  );
}
