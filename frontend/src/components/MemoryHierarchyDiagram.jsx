import React from 'react';
import { Layers, Database, Cpu, Zap, HardDrive, RefreshCw, Trash2, ArrowDown, Info } from 'lucide-react';

export default function MemoryHierarchyDiagram({ coaStats, onClearCache, clearing }) {
  const lru = coaStats?.lru_cache || {};
  const entries = lru.current_keys_mru_to_lru || [];
  const hits = lru.hits ?? 0;
  const misses = lru.misses ?? 0;
  const hitRatio = lru.hit_ratio !== undefined ? (lru.hit_ratio * 100).toFixed(1) : '0.0';
  const capacity = lru.capacity ?? 6;
  const currentSize = lru.size ?? entries.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Educational Architecture Explanation */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Computer Organization & Architecture (COA) Memory Hierarchy
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Demonstrating the speed-cost-capacity tradeoff in deep learning inference and data retrieval
            </p>
          </div>
          <span className="badge badge-purple">Academic COA Model</span>
        </div>

        {/* 4-Level Pyramid Diagram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
          {/* Level 1: CPU Registers & Hardware L1/L2/L3 */}
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap style={{ width: '20px', height: '20px', color: '#ec4899' }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f472b6' }}>Level 1: CPU Registers & L1/L2/L3 SRAM</span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Matrix multiplications, vector dot products, activations</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', color: '#f472b6', fontWeight: 700 }}>
              <span>~0.5 - 15 ns</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>Few KB - MB</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <ArrowDown style={{ width: '16px', height: '16px', margin: '0 auto' }} />
          </div>

          {/* Level 2: Main Memory (RAM) */}
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu style={{ width: '20px', height: '20px', color: '#818cf8' }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#a5b4fc' }}>Level 2: Main Memory (DRAM) — Preloaded PyTorch Weights</span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  MobileNetV3 loaded once into RAM (5.88 MB). Zero repeated disk read overhead.
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 700 }}>
              <span>~50 - 100 ns</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>8 - 32 GB</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <ArrowDown style={{ width: '16px', height: '16px', margin: '0 auto' }} />
          </div>

          {/* Level 3: Application LRU Cache */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers style={{ width: '20px', height: '20px', color: '#34d399' }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#34d399' }}>Level 3: Application LRU Cache (In-RAM Doubly-Linked List + Hash Map)</span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Caches hot food nutrition records in memory. Avoids redundant SQL disk queries.
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
              <span>~2 - 15 µs (O(1))</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>Capacity: {capacity}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <ArrowDown style={{ width: '16px', height: '16px', margin: '0 auto' }} />
          </div>

          {/* Level 4: Secondary Storage */}
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24' }}>Level 4: Secondary Storage (NVMe SSD / HDD) — SQLite Database</span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Persistent disk storage for `food_nutrition.db`, history records, and `.pt` checkpoint.
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>
              <span>~0.5 - 5.0 ms</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>500 GB - 2 TB</span>
            </div>
          </div>
        </div>

        {/* Academic Disclaimer Box */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          fontSize: '0.78rem',
          color: '#cbd5e1'
        }}>
          <Info style={{ width: '16px', height: '16px', color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#ffffff' }}>Architectural Distinction Note:</strong> The Software LRU Cache is an application-level demonstration of caching principles, temporal/spatial locality, and eviction policies. It runs within process memory (Python heap) and does not directly manipulate or bypass the CPU's physical L1/L2/L3 hardware cache lines.
          </div>
        </div>
      </div>

      {/* Live LRU Cache Inspector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Live LRU Cache Inspector</h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Tracks cache hits, misses, hit ratio, and real-time MRU-to-LRU eviction ordering
            </p>
          </div>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onClearCache}
            disabled={clearing}
          >
            <Trash2 style={{ width: '14px', height: '14px' }} />
            <span>Flush Cache (Force Miss)</span>
          </button>
        </div>

        {/* Telemetry Numbers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Cache Hits</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>{hits}</div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Cache Misses</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>{misses}</div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Hit Ratio</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>{hitRatio}%</div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Cache Occupancy</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc', fontFamily: 'monospace' }}>{currentSize} / {capacity}</div>
          </div>
        </div>

        {/* Real-time Order from MRU to LRU */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
              Current Cache Linked-List Ordering:
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Head = MRU (Most Recently Used) → Tail = LRU (Next to Evict)
            </span>
          </div>

          {entries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', color: '#64748b', fontSize: '0.85rem' }}>
              Cache is empty. Analyze foods to populate cache entries.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              {entries.map((key, i) => {
                const isMRU = i === 0;
                const isLRU = i === entries.length - 1 && entries.length === capacity;

                return (
                  <div
                    key={key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: isMRU
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isLRU
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${
                        isMRU ? '#10b981' : isLRU ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'
                      }`,
                      fontSize: '0.82rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    <span style={{
                      fontWeight: 700,
                      color: isMRU ? '#34d399' : isLRU ? '#f87171' : '#ffffff'
                    }}>
                      {key}
                    </span>
                    {isMRU && (
                      <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 5px' }}>MRU</span>
                    )}
                    {isLRU && (
                      <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '2px 5px' }}>Next Evict</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
