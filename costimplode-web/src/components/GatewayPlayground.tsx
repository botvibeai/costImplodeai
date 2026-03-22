import { useState } from 'react';
import { Send, Zap, Server, Activity } from 'lucide-react';

export const GatewayPlayground = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      // Connects to Live Cloudflare Worker AI Gateway API
      const res = await fetch('https://costimplode-api.michael-38d.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      // Fallback Mock 
      setTimeout(() => {
        const isComplex = prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('analyze');
        setResponse({
          source: isComplex ? 'Cometapi (GPT-4o)' : 'Cloudflare Workers AI (@cf/meta/llama-3.2-1b-instruct)',
          tier: isComplex ? 'Brain Surgeon' : 'Edge Janitor',
          response: isComplex 
            ? 'This required high reasoning capabilities. Routed via aggregators to frontier model.' 
            : 'Simple classification task executed at edge. Ultra-low latency.',
          costSavedPercentage: isComplex ? 0 : 96,
          latency: isComplex ? '620ms' : '88ms'
        });
        setLoading(false);
      }, 700);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="react-panel" style={{ padding: '0', display: 'flex', height: '520px', overflow: 'hidden' }}>
      {/* Playground Config Sidebar */}
      <div style={{ width: '280px', borderRight: '1px solid var(--border)', padding: '1.5rem', background: 'var(--bg)' }}>
        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
          <Server size={18} color="var(--orange)" /> Connection Stats
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Status</div>
            <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
                Universal Endpoint Live
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>AIMLAPI Catalog</div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>400+ Linked</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>CometAPI Catalog</div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>620+ Linked</div>
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Arbitrage Rule</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Prompts matching "code" or "analyze" map to <span style={{color:'var(--purple)'}}>Brain Surgeon</span>. Else, routed to <span style={{color:'var(--green)'}}>Edge</span>.
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat / Console Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {response ? (
            <div className="animate-fade">
              <div style={{ marginBottom: '1.2rem', color: 'var(--muted)', fontSize: '13px', fontWeight: 500 }}>
                Request: "{prompt}"
              </div>

              <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '1.5rem', border: `1px solid ${response.tier === 'Brain Surgeon' ? 'var(--purple)' : 'var(--green)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '4px 10px', background: response.tier === 'Brain Surgeon' ? 'var(--purple)' : 'var(--green)', color: 'white', fontSize: '11px', fontWeight: 800, borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {response.tier}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--dim)', fontWeight: 600, fontFamily: 'monospace' }}>{response.source}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                    <span style={{color: 'var(--dim)'}}>TTFT:</span> {response.latency}
                  </div>
                </div>

                <p style={{ lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '14px' }}>{response.response}</p>

                {response.costSavedPercentage > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--orange-dim)', color: 'var(--orange-light)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--orange-border)' }}>
                    <Zap size={14} /> Arbitrage Triggered: {response.costSavedPercentage}% Savings
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
              {loading ? (
                <>
                  <div style={{ width: '24px', height: '24px', border: '3px solid var(--border)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{fontSize: '13px', fontWeight: 500}}>Executing routing logic...</span>
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </>
              ) : (
                <>
                  <Activity size={36} opacity={0.3} />
                  <span style={{fontSize: '14px', fontWeight: 500, maxWidth: '250px'}}>Enter a prompt to trace the AI Gateway routing decision.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.2rem', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="react-input-field" 
              placeholder="e.g., 'Classify this text' (Janitor) OR 'Analyze standard deviation' (Surgeon)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              style={{ paddingRight: '3.5rem' }}
            />
            <button 
              type="submit" 
              disabled={loading || !prompt.trim()}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: prompt.trim() ? 'var(--orange)' : 'var(--border)', 
                border: 'none', 
                color: 'white', 
                cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
