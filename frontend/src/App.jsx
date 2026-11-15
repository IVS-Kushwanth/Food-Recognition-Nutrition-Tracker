import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import CoaExplorerPage from './pages/CoaExplorerPage';
import AgentsDashboardPage from './pages/agents/AgentsDashboardPage';
import BotAPage from './pages/agents/BotAPage';
import BotBPage from './pages/agents/BotBPage';
import TaskManagerPage from './pages/agents/TaskManagerPage';
import AgentCommsPage from './pages/agents/AgentCommsPage';
import ReportsPage from './pages/agents/ReportsPage';
import { Utensils, Cpu, Heart, Database, ShieldCheck, Bot, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'analyze' && <AnalysisPage onNavigateTab={setActiveTab} />}
        {activeTab === 'cpu_sim' && <CoaExplorerPage defaultModule="cpu_sim" />}
        {activeTab === 'cpu_gpu' && <CoaExplorerPage defaultModule="cpu_gpu" />}
        {activeTab === 'coa' && <CoaExplorerPage defaultModule="memory_hierarchy" />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'agents' && <AgentsDashboardPage onNavigateTab={setActiveTab} />}
        {activeTab === 'bot_a' && <BotAPage onNavigateTab={setActiveTab} />}
        {activeTab === 'bot_b' && <BotBPage onNavigateTab={setActiveTab} />}
        {activeTab === 'tasks' && <TaskManagerPage onNavigateTab={setActiveTab} />}
        {activeTab === 'comms' && <AgentCommsPage onNavigateTab={setActiveTab} />}
        {activeTab === 'reports' && <ReportsPage onNavigateTab={setActiveTab} />}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        padding: '24px 20px',
        fontSize: '0.82rem',
        color: '#64748b'
      }}>
        <div className="container-xl" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Utensils style={{ width: '15px', height: '15px' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>NutriVision AI</span>
                <span style={{ color: '#94a3b8', marginLeft: '6px' }}>• Food Vision Tracker & Autonomous Agents Hub</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.76rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bot style={{ width: '14px', height: '14px', color: '#c084fc' }} />
                Bot A: COA Researcher
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap style={{ width: '14px', height: '14px', color: '#34d399' }} />
                Bot B: AI Engineer
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                MobileNetV3 (5.88 MB RAM)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
                IFCT 2017 & USDA Database
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.74rem' }}>
            <p>
              Dual Autonomous AI Agents Control Center with Real Tool Execution, Inter-Agent Messaging, and Audit Logging.
            </p>
            <p style={{ color: '#475569' }}>
              Real-time hardware telemetry via psutil and PyTorch. No fabricated measurements.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
