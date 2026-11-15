import React, { useEffect, useState } from 'react';
import { History, Trash2, Calendar, Scale, Flame, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistory(100, 0);
      setHistory(data.history || []);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Failed to load analysis history from SQLite database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (id) => {
    setDeletingId(id);
    try {
      await api.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete item error:', err);
      setError('Failed to delete history record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all analysis history records from the database?')) {
      return;
    }
    setClearing(true);
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Clear history error:', err);
      setError('Failed to clear history.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <History style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>Analysis History</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Persistent historical records stored in SQLite database (`analysis_history` table)
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
            <span>Refresh</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleClearAll}
              disabled={clearing}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', marginBottom: '20px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <div className="animate-spin" style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
          <span>Loading historical queries from SQLite database...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <History style={{ width: '48px', height: '48px', color: '#475569', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#cbd5e1' }}>No Analysis History Yet</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
            Upload and analyze a food image to see persistent nutritional records stored here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item) => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
            const isMatch = Boolean(item.is_match);
            const conf = item.prediction_confidence ? (item.prediction_confidence * 100).toFixed(0) : 'N/A';

            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* Left Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                  {item.image_path ? (
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, backgroundColor: '#0f172a' }}>
                      <img
                        src={`/${item.image_path.replace(/\\/g, '/')}`}
                        alt={item.predicted_food_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0 }}>
                      <Flame style={{ width: '24px', height: '24px' }} />
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                        {item.predicted_food_name || item.food_key}
                      </h4>
                      <span className={`badge ${isMatch ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {isMatch ? 'Matched' : 'Mismatch'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#818cf8', fontFamily: 'monospace' }}>
                        Conf: {conf}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      {item.user_food_name && (
                        <span>User Input: <strong>"{item.user_food_name}"</strong></span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar style={{ width: '12px', height: '12px' }} />
                        {dateStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center Nutrition Snapshot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scale style={{ width: '15px', height: '15px', color: '#a5b4fc' }} />
                    <span style={{ color: '#cbd5e1' }}><strong>{item.serving_weight_g}g</strong> serving</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame style={{ width: '15px', height: '15px', color: '#f87171' }} />
                    <span style={{ color: '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>
                      {item.calories_kcal ? Number(item.calories_kcal).toFixed(0) : '0'} kcal
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.76rem', color: '#94a3b8' }}>
                    <span>P: <strong style={{ color: '#34d399' }}>{item.protein_g}g</strong></span>
                    <span>C: <strong style={{ color: '#60a5fa' }}>{item.carbohydrates_g}g</strong></span>
                    <span>F: <strong style={{ color: '#fbbf24' }}>{item.fat_g}g</strong></span>
                  </div>
                </div>

                {/* Right Action: Delete */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingId === item.id}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#f87171', padding: '6px 10px' }}
                    title="Delete record from SQLite"
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
