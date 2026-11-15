import React, { useEffect, useState } from 'react';
import MemoryHierarchyDiagram from '../components/MemoryHierarchyDiagram';
import CpuArchitectureSimulator from '../components/CpuArchitectureSimulator';
import CpuGpuCommunicationSimulator from '../components/CpuGpuCommunicationSimulator';
import { api } from '../services/api';
import { Cpu, Zap, RefreshCw, Play, CheckCircle2, AlertTriangle, Layers, Clock, ShieldCheck, Activity } from 'lucide-react';

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

export default function CoaExplorerPage({ defaultModule = 'cpu_sim' }) {
  const [activeModule, setActiveModule] = useState(defaultModule);
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
      {/* Title & Architecture Subsystem Header */}
      <div style={{ marginBottom: '24px', maxWidth: '850px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          borderRadius: '20px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          marginBottom: '10px'
        }}>
          <Cpu style={{ width: '15px', height: '15px', color: '#60a5fa' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Computer Organization & Architecture (COA) Suite
          </span>
        </div>
        <h1 className="classic-header" style={{ fontSize: '2.1rem', margin: 0 }}>
          Computer Architecture & Interconnect Systems Laboratory
        </h1>
        <p style={{ fontSize: '0.92rem', color: '#94a3b8', marginTop: '6px' }}>
          Interactive educational simulators modeling the internal CPU Von Neumann datapath (<a href="https://cpusimulator.tech/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>cpusimulator.tech</a> workflow), CPU-GPU PCIe bus communication, and 4-tier memory hierarchy caching.
        </p>
      </div>

      {/* Classic Module Switcher Navigation */}
      <div className="classic-subnav" style={{ marginBottom: '24px' }}>
        <button
          className={`classic-subnav-btn ${activeModule === 'cpu_sim' ? 'active' : ''}`}
          onClick={() => setActiveModule('cpu_sim')}
        >
          <Cpu style={{ width: '17px', height: '17px', color: activeModule === 'cpu_sim' ? '#60a5fa' : '#94a3b8' }} />
          <span>1. CPU Architecture Datapath (cpusimulator.tech)</span>
        </button>

        <button
          className={`classic-subnav-btn ${activeModule === 'cpu_gpu' ? 'active' : ''}`}
          onClick={() => setActiveModule('cpu_gpu')}
        >
          <Zap style={{ width: '17px', height: '17px', color: activeModule === 'cpu_gpu' ? '#34d399' : '#94a3b8' }} />
          <span>2. CPU-GPU Interconnect (PCIe Bus & DMA)</span>
        </button>

        <button
          className={`classic-subnav-btn ${activeModule === 'memory_hierarchy' ? 'active' : ''}`}
          onClick={() => setActiveModule('memory_hierarchy')}
        >
          <Layers style={{ width: '17px', height: '17px', color: activeModule === 'memory_hierarchy' ? '#c084fc' : '#94a3b8' }} />
          <span>3. 4-Tier Memory Hierarchy & LRU Cache</span>
        </button>
      </div>

      {/* Module 1: CPU Simulator (cpusimulator.tech) */}
      {activeModule === 'cpu_sim' && (
        <CpuArchitectureSimulator />
      )}

      {/* Module 2: CPU-GPU Communication */}
      {activeModule === 'cpu_gpu' && (
        <CpuGpuCommunicationSimulator />
      )}

      {/* Module 3: Memory Hierarchy & LRU Cache Benchmarking */}
      {activeModule === 'memory_hierarchy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Interactive Experiment: Cache Hit vs Miss Benchmark */}
          <div className="classic-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <Zap style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Interactive Cache Experiment: Hit vs Miss Latency Benchmark
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Trigger back-to-back nutritional queries to contrast SQLite disk I/O (~1-5ms) with in-memory software LRU cache retrieval (~2-15µs)
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
                borderRadius: '10px',
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <AlertTriangle style={{ width: '14px', height: '14px', color: '#f87171' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fca5a5' }}>1st Query (Uncached / Miss)</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                      {benchmarkResult.firstCall?.latency_ms?.toFixed(3)} ms
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      Source: {benchmarkResult.firstCall?.tier} (Disk read required)
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6ee7b7' }}>2nd Query (LRU Cache Hit)</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                      {(benchmarkResult.secondCall?.latency_ms * 1000)?.toFixed(1)} µs
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      Source: Level 3 LRU Cache ({benchmarkResult.secondCall?.latency_ms?.toFixed(4)} ms)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Memory Hierarchy Diagram */}
          <MemoryHierarchyDiagram
            coaStats={coaStats}
            onClearCache={handleClearCache}
            clearing={clearing}
          />
        </div>
      )}
    </div>
  );
}
