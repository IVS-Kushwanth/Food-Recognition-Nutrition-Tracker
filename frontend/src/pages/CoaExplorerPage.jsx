import React, { useEffect, useState } from 'react';
import MemoryHierarchyDiagram from '../components/MemoryHierarchyDiagram';
import { api } from '../services/api';
import { Cpu, Zap, RefreshCw, Play, CheckCircle2, AlertTriangle, Layers, Clock, ShieldCheck } from 'lucide-react';

const TEST_DISHES = [
  'chicken_biryani',
  'dosa',
  'idli',
  'paneer_tikka',
  'dal_makhani',
  'samosa',
  'pizza',
  'burger'
];

export default function CoaExplorerPage() {
  const [coaStats, setCoaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [selectedDish, setSelectedDish] = useState('chicken_biryani');

  const fetchStats = async () => {
    try {
      const data = await api.getCoaStats();
      setCoaStats(data);
    } catch (err) {
      console.error('Failed to fetch COA stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await api.clearLruCache();
      await fetchStats();
      setBenchmarkResult(null);
    } catch (err) {
      console.error('Failed to clear LRU cache:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      // Step 1: Run lookup
      const res1 = await api.recalculateNutrition(selectedDish, 200);
      // Step 2: Run second lookup to demonstrate cache hit
      const res2 = await api.recalculateNutrition(selectedDish, 200);

      setBenchmarkResult({
        dish: selectedDish,
        firstCall: res1.cache_lookup,
        secondCall: res2.cache_lookup,
        speedup: res1.cache_lookup?.latency_ms > 0 && res2.cache_lookup?.latency_ms > 0
          ? (res1.cache_lookup.latency_ms / Math.max(res2.cache_lookup.latency_ms, 0.001)).toFixed(1)
          : 'N/A'
      });

      await fetchStats();
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Title */}
      <div style={{ marginBottom: '28px', maxWidth: '800px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '12px' }}>
          <Cpu style={{ width: '15px', height: '15px', color: '#818cf8' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            COA Systems Module
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Memory Hierarchy & CPU Architecture Profiler
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '8px' }}>
          Explore the performance trade-offs between hardware CPU registers, RAM residency, application LRU caching, and secondary disk storage in computer vision pipelines.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Interactive Experiment: Cache Hit vs Miss Benchmark */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <Zap style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                  Interactive Cache Experiment: Hit vs Miss Latency Benchmark
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Trigger back-to-back nutritional queries to contrast SQLite disk I/O with in-memory LRU cache retrieval
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={selectedDish}
                onChange={(e) => setSelectedDish(e.target.value)}
                className="input-text"
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: '180px' }}
              >
                {TEST_DISHES.map((d) => (
                  <option key={d} value={d} style={{ backgroundColor: '#111827' }}>
                    {d.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRunBenchmark}
                disabled={benchmarkLoading}
              >
                <Play className={benchmarkLoading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
                <span>Run Benchmark</span>
              </button>
            </div>
          </div>

          {/* Benchmark Output Card */}
          {benchmarkResult && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                  Benchmark Result for: <span style={{ color: '#818cf8' }}>{benchmarkResult.dish}</span>
                </span>
                <span className="badge badge-green">
                  Speedup: {benchmarkResult.speedup}x
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {/* 1st Access */}
                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: benchmarkResult.firstCall.status === 'CACHE_HIT' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${benchmarkResult.firstCall.status === 'CACHE_HIT' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                    1st Query Call
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', marginTop: '4px' }}>
                    {benchmarkResult.firstCall.latency_ms < 1
                      ? `${(benchmarkResult.firstCall.latency_ms * 1000).toFixed(0)} µs`
                      : `${benchmarkResult.firstCall.latency_ms.toFixed(2)} ms`}
                  </div>
                  <span className={`badge ${benchmarkResult.firstCall.status === 'CACHE_HIT' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    {benchmarkResult.firstCall.status}
                  </span>
                </div>

                {/* 2nd Access */}
                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                    2nd Query Call (Immediate Cache Hit)
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', marginTop: '4px' }}>
                    {benchmarkResult.secondCall.latency_ms < 1
                      ? `${(benchmarkResult.secondCall.latency_ms * 1000).toFixed(0)} µs`
                      : `${benchmarkResult.secondCall.latency_ms.toFixed(2)} ms`}
                  </div>
                  <span className="badge badge-green" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    CACHE_HIT (RAM Hash Map)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Memory Hierarchy Diagram & Live LRU Inspector */}
        <MemoryHierarchyDiagram
          coaStats={coaStats}
          onClearCache={handleClearCache}
          clearing={clearing}
        />

        {/* Comparative Latency Reference Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
            COA Architecture: Memory Hierarchy Latency Spectrum
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Hierarchy Tier</th>
                  <th style={{ padding: '10px 12px' }}>Component in Project</th>
                  <th style={{ padding: '10px 12px' }}>Typical Access Latency</th>
                  <th style={{ padding: '10px 12px' }}>Data Stored</th>
                  <th style={{ padding: '10px 12px' }}>Capacity Range</th>
                </tr>
              </thead>
              <tbody style={{ color: '#e2e8f0' }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#f472b6' }}>CPU Registers / L1</td>
                  <td style={{ padding: '12px' }}>CPU Execution Units</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>~0.5 - 1.5 ns</td>
                  <td style={{ padding: '12px' }}>Vector Dot Products & Activations</td>
                  <td style={{ padding: '12px' }}>32 - 64 KB</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#ec4899' }}>Hardware L2 / L3 SRAM</td>
                  <td style={{ padding: '12px' }}>CPU On-Die Cache</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>~3 - 15 ns</td>
                  <td style={{ padding: '12px' }}>Hot Layer Tensor Buffers</td>
                  <td style={{ padding: '12px' }}>1 - 32 MB</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#818cf8' }}>Main Memory (DRAM)</td>
                  <td style={{ padding: '12px' }}>Resident PyTorch Model</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>~50 - 100 ns</td>
                  <td style={{ padding: '12px' }}>MobileNetV3 Weights (5.88 MB RAM)</td>
                  <td style={{ padding: '12px' }}>8 - 32 GB</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#34d399' }}>Application LRU Cache</td>
                  <td style={{ padding: '12px' }}>In-Memory Hash Map + DLL</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>~2 - 15 µs (O(1))</td>
                  <td style={{ padding: '12px' }}>Frequent Food Nutrition Records</td>
                  <td style={{ padding: '12px' }}>6 Records (Configurable)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#fbbf24' }}>Secondary Storage</td>
                  <td style={{ padding: '12px' }}>SQLite (`food_nutrition.db`)</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>~0.5 - 5.0 ms</td>
                  <td style={{ padding: '12px' }}>Full Catalog, History, Checkpoints</td>
                  <td style={{ padding: '12px' }}>500 GB - 2 TB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
