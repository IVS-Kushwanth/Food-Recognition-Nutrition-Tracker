import React from 'react';
import { Cpu, Zap, HardDrive, Layers, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CoaTelemetryPanel({ coaMetrics, compact = false }) {
  if (!coaMetrics) return null;

  const {
    image_preprocess_ms = 0,
    model_inference_ms = 0,
    cache_lookup_ms = 0,
    cache_status = 'CACHE_MISS',
    total_processing_ms = 0,
    model_ram_resident = true,
    model_ram_mb = 5.88,
    lru_cache_stats = {},
    db_lookup_saved = false
  } = coaMetrics;

  const isHit = cache_status === 'CACHE_HIT';

  return (
    <div className="glass-panel" style={{ padding: compact ? '16px' : '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu style={{ width: '20px', height: '20px', color: '#6366f1' }} />
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>COA Execution & Memory Hierarchy Telemetry</h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Real-time measurement of CPU pipeline, RAM residency, and Application LRU cache
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`badge ${isHit ? 'badge-green' : 'badge-amber'}`} style={{ fontFamily: 'monospace' }}>
            {cache_status}
          </span>
          <span className="badge badge-purple">
            RAM: {model_ram_mb} MB
          </span>
        </div>
      </div>

      {/* Latency Pipeline Visualizer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* Step 1: Preprocessing */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
            <Clock style={{ width: '12px', height: '12px' }} />
            <span>1. Preprocess</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', marginTop: '4px' }}>
            {Number(image_preprocess_ms).toFixed(2)} ms
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>CPU Resizing & Norm</span>
        </div>

        {/* Step 2: PyTorch Inference (RAM) */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
            <Zap style={{ width: '12px', height: '12px' }} />
            <span>2. PyTorch Inference</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818cf8', fontFamily: 'monospace', marginTop: '4px' }}>
            {Number(model_inference_ms).toFixed(2)} ms
          </div>
          <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>RAM Resident (MobileNetV3)</span>
        </div>

        {/* Step 3: Cache / DB Lookup */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: isHit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          border: `1px solid ${isHit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isHit ? '#34d399' : '#fbbf24', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
            {isHit ? <Layers style={{ width: '12px', height: '12px' }} /> : <HardDrive style={{ width: '12px', height: '12px' }} />}
            <span>3. Nutrition Access</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isHit ? '#34d399' : '#fbbf24', fontFamily: 'monospace', marginTop: '4px' }}>
            {cache_lookup_ms < 1
              ? `${(cache_lookup_ms * 1000).toFixed(0)} µs`
              : `${Number(cache_lookup_ms).toFixed(2)} ms`}
          </div>
          <span style={{ fontSize: '0.7rem', color: isHit ? '#6ee7b7' : '#fde68a' }}>
            {isHit ? 'LRU Memory Hit (O(1))' : 'SQLite Disk Lookup'}
          </span>
        </div>

        {/* Step 4: Total End-to-End */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
            <Clock style={{ width: '12px', height: '12px' }} />
            <span>Total Latency</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', marginTop: '4px' }}>
            {Number(total_processing_ms).toFixed(2)} ms
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>End-to-End CPU Pipeline</span>
        </div>
      </div>

      {/* LRU Cache State Summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span>Hits: <strong style={{ color: '#34d399' }}>{lru_cache_stats.hits ?? 0}</strong></span>
          <span>Misses: <strong style={{ color: '#fbbf24' }}>{lru_cache_stats.misses ?? 0}</strong></span>
          <span>Hit Ratio: <strong style={{ color: '#60a5fa' }}>{lru_cache_stats.hit_ratio ? (lru_cache_stats.hit_ratio * 100).toFixed(1) : '0.0'}%</strong></span>
          <span>Evictions: <strong style={{ color: '#f87171' }}>{lru_cache_stats.evictions ?? 0}</strong></span>
          <span>Active Cached Entries: <strong style={{ color: '#c084fc' }}>{lru_cache_stats.size ?? 0}/{lru_cache_stats.capacity ?? 6}</strong></span>
        </div>

        {db_lookup_saved && (
          <span style={{ color: '#34d399', fontSize: '0.74rem', fontWeight: 600 }}>
            ⚡ Saved disk I/O via in-memory O(1) hash map
          </span>
        )}
      </div>
    </div>
  );
}
