import React, { useEffect, useState } from 'react';
import { Utensils, Cpu, History, Activity, Database, Bot, Zap, Clock, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [health, setHealth] = useState(null);
  const [agentCounts, setAgentCounts] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
        const aData = await api.getAgentsOverview();
        setAgentCounts(aData?.counts);
      } catch (err) {
        setHealth({ status: 'offline' });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 12000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    // Core Food Recognition & COA Architecture Group
    { id: 'analyze', label: 'Analyze Food', icon: Activity },
    { id: 'cpu_sim', label: 'CPU Simulator', icon: Cpu, badge: 'cpusim' },
    { id: 'cpu_gpu', label: 'CPU-GPU Bus', icon: Zap },
    { id: 'coa', label: 'Memory Hierarchy', icon: Database },
    { id: 'history', label: 'History', icon: History },
    // Autonomous Multi-Agent Suite
    { id: 'agents', label: 'Agents Hub', icon: Bot },
    { id: 'bot_a', label: 'Bot A (COA)', icon: Cpu },
    { id: 'bot_b', label: 'Bot B (AI)', icon: Zap },
    { id: 'tasks', label: 'Tasks', icon: Clock, badge: agentCounts?.in_progress ? `${agentCounts.in_progress}` : null },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-3 mb-6 backdrop-blur-md" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('analyze')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)'
          }}>
            <Utensils style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', letterSpacing: '-0.02em' }}>NutriVision AI</span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Autonomous Agents</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Food Recognition & Multi-Agent Control Center</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '4px 6px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflowX: 'auto',
          maxWidth: '100%'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? '#6366f1' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon style={{ width: '15px', height: '15px' }} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    marginLeft: '2px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System / RAM Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {health?.status === 'healthy' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#34d399'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34d399' }}></span>
              <span>RAM Resident ({health.model_ram_mb} MB)</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#fbbf24'
            }}>
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
