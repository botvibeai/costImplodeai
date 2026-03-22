import { Activity, Database, DollarSign, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';

export const ArbitrageDashboard = () => {
  const [auditData, setAuditData] = useState<any>({
    status: "Initializing Rig Audit...",
    vectorCapacity: "Pending",
    dbPressure: "Pending",
    hitRate: "Syncing..."
  });

  useEffect(() => {
    // Poll the backend rig audit periodically
    const fetchAudit = async () => {
      try {
        const res = await fetch("https://costimplode-api.michael-38d.workers.dev/api/audit");
        const data = await res.json();
        // Since the current endpoint returns a string "RIG STRENGTH...", let's parse or just display it
        setAuditData({ ...auditData, status: data.status });
      } catch (e) {
        console.error("Rig audit offline", e);
      }
    };
    fetchAudit();
    const interval = setInterval(fetchAudit, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="react-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <Layers color="var(--blue)" /> 
          Gateway Telemetry
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--green)', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 700 }}>
          Live: 800+ Models Synced
        </span>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#1c1e26', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>System Audit Status</div>
        <div style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{auditData.status}</div>
      </div>

      <div className="react-grid react-grid-3" style={{ marginBottom: '2.5rem' }}>
        <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '1rem', fontSize: '14px', fontWeight: 600 }}>
            <Activity size={18} />
            Inference Volume (24h)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>14.2M</div>
          <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '6px', fontWeight: 600 }}>+12% vs prior day</div>
        </div>

        <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '1rem', fontSize: '14px', fontWeight: 600 }}>
            <Database size={18} />
            Semantic Cache Hits
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>6.1M</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px', fontWeight: 600 }}>43% Cache Ratio</div>
        </div>

        <div style={{ background: 'var(--orange-dim)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--orange-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--orange-light)', marginBottom: '1rem', fontSize: '14px', fontWeight: 700 }}>
            <DollarSign size={18} />
            Total Arbitrage Savings
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>$84,209</div>
          <div style={{ fontSize: '12px', color: 'var(--orange-light)', marginTop: '6px', fontWeight: 600 }}>91.4% Edge-Native Discount</div>
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '1.2rem', color: 'var(--dim)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Throughput Matrix: Brain Surgeon vs Janitor</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: '150px' }}>
              <div style={{ fontWeight: 600 }}>Edge Janitor</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Llama 3.2 1B (Workers)</div>
            </div>
            <div style={{ flex: 1, margin: '0 1.5rem', background: 'var(--border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: 'var(--green)' }}></div>
            </div>
            <div style={{ minWidth: '60px', textAlign: 'right', fontWeight: 700 }}>68%</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: '150px' }}>
              <div style={{ fontWeight: 600 }}>Balanced</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Gemma 3 12B IT</div>
            </div>
            <div style={{ flex: 1, margin: '0 1.5rem', background: 'var(--border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: '24%', height: '100%', background: 'var(--blue)' }}></div>
            </div>
            <div style={{ minWidth: '60px', textAlign: 'right', fontWeight: 700 }}>24%</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: '150px' }}>
              <div style={{ fontWeight: 600 }}>Brain Surgeon</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>GPT-4o (Cometapi)</div>
            </div>
            <div style={{ flex: 1, margin: '0 1.5rem', background: 'var(--border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: '8%', height: '100%', background: 'var(--purple)' }}></div>
            </div>
            <div style={{ minWidth: '60px', textAlign: 'right', fontWeight: 700 }}>8%</div>
          </div>

        </div>
      </div>
    </div>
  );
}
