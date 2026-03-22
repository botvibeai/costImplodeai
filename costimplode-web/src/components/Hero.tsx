import { ArrowRight, Zap, Shield, Repeat } from 'lucide-react';

export const Hero = () => {
  return (
    <div style={{ padding: '6rem 2rem 4rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="container animate-fade">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '2rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 10px var(--success-color)' }}></div>
        Universal Endpoint Available
      </div>
      
      <h1 style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '900px' }}>
        A Paradigm Shift in AI <br/>
        <span className="heading-gradient">Inference Economics</span>
      </h1>
      
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '750px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
        Decouple intelligence consumption from restrictive provider pricing. Our AI Arbitrage Gateway dynamically routes workloads across 800+ models, driving cost reductions up to 95% with edge-native observability and semantic caching.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
        <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          Connect Cloudflare Gateway <ArrowRight size={20} />
        </button>
        <button className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          Read the Whitepaper
        </button>
      </div>

      <div className="grid grid-cols-3" style={{ width: '100%', textAlign: 'left', marginTop: '2rem' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap color="#3b82f6" size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Dynamic Routing</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Algorithmic differentiation between complex tasks ("Brain Surgeon") and simple classification ("Janitor") using neuron-based analysis.
          </p>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Repeat color="#a855f7" size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Semantic Caching</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            4-layer caching architecture utilizing Cloudflare Vectorize and KV to completely eliminate token fees for recurrent semantic queries.
          </p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield color="#10b981" size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Safety & Privacy</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Inline firewall protections with PII Context Re-hydration, ensuring data privacy before your query ever hits an aggregator.
          </p>
        </div>
      </div>
    </div>
  );
}
