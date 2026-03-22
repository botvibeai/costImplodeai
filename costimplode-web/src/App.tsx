import { useState } from 'react';
import { ArbitrageDashboard } from './components/ArbitrageDashboard';
import { GatewayPlayground } from './components/GatewayPlayground';
import { BrainCircuit, Layers } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'playground'>('playground');

  return (
    <section className="section" style={{ paddingTop: '0' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2>Interactive <span>Playground</span> & Metrics</h2>
        <p className="section-sub" style={{ margin: '0 auto', fontSize: '1.05rem', maxWidth: '650px' }}>
          Test the dynamic routing engine live or view global telemetry from the Cloudflare edge.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--card)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('playground')}
            style={{
              background: activeTab === 'playground' ? 'var(--orange-dim)' : 'transparent',
              color: activeTab === 'playground' ? 'var(--orange-light)' : 'var(--muted)',
              border: activeTab === 'playground' ? '1px solid var(--orange-border)' : '1px solid transparent',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            <BrainCircuit size={18} />
            Live Playground
          </button>          
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: activeTab === 'dashboard' ? 'var(--orange-dim)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--orange-light)' : 'var(--muted)',
              border: activeTab === 'dashboard' ? '1px solid var(--orange-border)' : '1px solid transparent',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            <Layers size={18} />
            Global Dashboard
          </button>
        </div>
      </div>

      <div className="animate-fade" key={activeTab}>
        {activeTab === 'dashboard' ? <ArbitrageDashboard /> : <GatewayPlayground />}
      </div>
    </section>
  );
}

export default App;
