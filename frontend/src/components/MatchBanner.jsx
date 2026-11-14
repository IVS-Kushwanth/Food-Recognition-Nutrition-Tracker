import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

export default function MatchBanner({ matchResult, onSelectFood, activeSelection }) {
  if (!matchResult) return null;

  const {
    is_match,
    match_type,
    similarity_score,
    message,
    user_input_normalized,
    predicted_food_name,
    predicted_food_key
  } = matchResult;

  const isMismatch = !is_match && user_input_normalized;
  const isNoText = !user_input_normalized;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px 22px',
        borderLeft: `5px solid ${isMismatch ? '#f59e0b' : isNoText ? '#6366f1' : '#10b981'}`,
        backgroundColor: isMismatch
          ? 'rgba(245, 158, 11, 0.08)'
          : isNoText
          ? 'rgba(99, 102, 241, 0.08)'
          : 'rgba(16, 185, 129, 0.08)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isMismatch ? (
              <AlertTriangle style={{ width: '22px', height: '22px', color: '#f59e0b', flexShrink: 0 }} />
            ) : isNoText ? (
              <HelpCircle style={{ width: '22px', height: '22px', color: '#818cf8', flexShrink: 0 }} />
            ) : (
              <CheckCircle2 style={{ width: '22px', height: '22px', color: '#10b981', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: isMismatch ? '#fbbf24' : isNoText ? '#c7d2fe' : '#34d399' }}>
                  {isMismatch
                    ? 'Mismatch Detected Between Input & Image'
                    : isNoText
                    ? 'Image-Only Recognition'
                    : 'Text & Image Match Confirmed'}
                </span>
                <span className={`badge ${isMismatch ? 'badge-amber' : isNoText ? 'badge-blue' : 'badge-green'}`}>
                  {match_type ? match_type.replace(/_/g, ' ') : 'VERIFIED'}
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#cbd5e1', marginTop: '2px' }}>
                {message}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Similarity Score:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
              {(similarity_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Warning and decision options when mismatch detected */}
        {isMismatch && (
          <div
            style={{
              marginTop: '4px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <p style={{ fontSize: '0.82rem', color: '#fde68a' }}>
              ⚠️ The entered dish <strong>"{user_input_normalized}"</strong> differs from the computer vision prediction <strong>"{predicted_food_name}"</strong>. Please confirm which dish to query nutrition for:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeSelection === 'image' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSelectFood('image', predicted_food_key, predicted_food_name)}
              >
                <span>Use Image Prediction: <strong>{predicted_food_name}</strong></span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeSelection === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSelectFood('user', user_input_normalized, user_input_normalized)}
              >
                <span>Force User Input: <strong>{user_input_normalized}</strong></span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
