/**
 * CostImplodeAI.com - AI Arbitrage Gateway
 * BotVibe.cloud
 *
 * PROVIDER HIERARCHY:
 * #1 CostImplode Native  → platform key pre-filled, free CF neurons, pure margin
 * #2 CometAPI            → BYOK, 500+ models, 10% referral
 * #3 AIMLAPI             → BYOK, 400+ models, 30% referral (6mo)
 * Emergency → Workers AI (only if ALL three fail)
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface Env {
  AI: Ai;
  ARBITRAGE_STATE: DurableObjectNamespace;
  SHARD_1: D1Database;
  DB: D1Database;
  COSTIMPLODE_KV: KVNamespace;
  ASSETS: R2Bucket;

  // Vars
  CF_ACCOUNT_ID: string;
  CF_GATEWAY_ID: string;
  FIREBASE_PROJECT_ID: string;
  ENVIRONMENT: string;
  NATIVE_AGGREGATOR_URL: string;

  // Secrets
  PLATFORM_API_KEY: string;
  AIML_API_KEY?: string;
  COMET_API_KEY?: string;
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-id, x-comet-key, x-aiml-key',
  'Access-Control-Max-Age': '86400',
};

function handleOptions(req: Request) {
  return new Response(null, {
    headers: { ...CORS, 'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization' },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// PII Redaction
const PII = [
  { re: /\b\d{3}-\d{2}-\d{4}\b/g, val: '[SSN]' },
  { re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g, val: '[EMAIL]' },
  { re: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, val: '[CC]' },
];
function pii(t: string) { return PII.reduce((s, r) => s.replace(r.re, r.val), t); }

// Firebase Auth
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
async function verifyFB(token: string, pid: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: `https://securetoken.google.com/${pid}`, audience: pid });
    return payload;
  } catch { return null; }
}

// ── Durable Object ─────────────────────────────────────────────────────────
export class ArbitrageStateDO {
  state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      if (!await this.state.storage.getAlarm()) {
        await this.state.storage.setAlarm(Date.now() + 6 * 3600 * 1000);
      }
    });
  }

  async alarm() {
    const stats = await this.state.storage.get<any>('stats') || {};
    for (const d of Object.values(stats) as any[]) {
      if (d.quarantinedUntil && d.quarantinedUntil < Date.now()) {
        d.quarantinedUntil = undefined; d.errors = 0; d.reqs = 0;
      }
    }
    await this.state.storage.put('stats', stats);
    await this.state.storage.setAlarm(Date.now() + 6 * 3600 * 1000);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const defaults = {
      native:   { reqs: 0, errors: 0, latency: 80,  cost: 0.00 },
      cometapi: { reqs: 0, errors: 0, latency: 180, cost: 0.08 },
      aimlapi:  { reqs: 0, errors: 0, latency: 150, cost: 0.10 },
    };
    let stats = await this.state.storage.get<any>('stats') || defaults;
    let metrics = await this.state.storage.get<any>('metrics') || {
      total: 0, cacheHits: 0, savings: 0, fallbacks: 0, emergency: 0
    };

    if (url.pathname === '/metrics') return new Response(JSON.stringify({ metrics, stats }));

    if (url.pathname === '/update') {
      const b = await req.json<any>();
      metrics.total++;
      if (b.cacheHit) metrics.cacheHits++;
      if (b.emergency) metrics.emergency++;
      if (b.fallback) metrics.fallbacks++;
      const p = stats[b.provider];
      if (p && !b.cacheHit) {
        p.reqs++;
        if (b.error) p.errors++;
        p.latency = Math.round((p.latency * 9 + b.latency) / 10);
        if (p.reqs > 50 && p.errors / p.reqs > 0.05) p.quarantinedUntil = Date.now() + 30 * 60000;
      }
      await this.state.storage.put('stats', stats);
      await this.state.storage.put('metrics', metrics);
      return new Response('OK');
    }

    if (url.pathname === '/best') {
      let best = 'native'; let max = -1;
      for (const [n, d] of Object.entries(stats) as any[]) {
        if (d.quarantinedUntil && d.quarantinedUntil > Date.now()) continue;
        const score = d.cost === 0 ? 999 : 1 / (d.latency * d.cost);
        if (score > max) { max = score; best = n; }
      }
      return new Response(JSON.stringify({ best, stats }));
    }
    return new Response('Not Found', { status: 404 });
  }
}

// ── Main Worker ─────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') return handleOptions(request);
    const url = new URL(request.url);
    const doId = env.ARBITRAGE_STATE.idFromName('global-v1');
    const DO = env.ARBITRAGE_STATE.get(doId);

    // Firebase auth proxy
    if (url.pathname.startsWith('/__/auth/')) {
      return fetch(new Request(
        `https://${env.FIREBASE_PROJECT_ID}.firebaseapp.com${url.pathname}${url.search}`,
        { method: request.method, headers: request.headers, body: request.body, redirect: 'manual' }
      ));
    }

    // Bot labyrinth
    const cf = (request as any).cf;
    if (cf?.botManagement?.score < 30) {
      return new Response('<html><body><script>setInterval(()=>document.body.innerHTML+=Math.random(),400)</script></body></html>',
        { headers: { 'Content-Type': 'text/html' } });
    }

    // Health
    if (url.pathname === '/health') return json({ status: 'ok', ts: new Date().toISOString() });

    // Audit
    if (url.pathname === '/api/audit' && request.method === 'GET') {
      const m = await (await DO.fetch(new Request('http://do/metrics'))).json<any>();
      let users = 0;
      try { users = (await env.SHARD_1.prepare('SELECT COUNT(*) as c FROM users').first<any>())?.c || 0; } catch {}
      return json({ status: 'OPERATIONAL', phase: 'BYOK+Native Phase 0', ...m, users, ts: new Date().toISOString() });
    }

    // Enterprise form
    if (url.pathname === '/api/enterprise-inquiry' && request.method === 'POST') {
      try {
        const b = await request.json<any>();
        await env.DB.prepare(
          'INSERT INTO enterprise_leads (name, company, email, monthly_volume, message) VALUES (?,?,?,?,?)'
        ).bind(b.name, b.company, b.email, b.volume, b.message).run();
        if (env.RESEND_API_KEY) {
          ctx.waitUntil(fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'noreply@costimplodeai.com', to: 'sales@costimplodeai.com',
              subject: `Enterprise Inquiry — ${b.company}`,
              html: `<h2>New Enterprise Lead</h2><p><b>Name:</b> ${b.name}</p><p><b>Company:</b> ${b.company}</p><p><b>Email:</b> ${b.email}</p><p><b>Volume:</b> ${b.volume}</p><p><b>Message:</b> ${b.message}</p>`,
            }),
          }));
        }
        return json({ success: true });
      } catch { return json({ error: 'Failed' }, 500); }
    }

    // Waitlist signup
    if (url.pathname === '/api/waitlist' && request.method === 'POST') {
      try {
        const b = await request.json<any>();
        await env.DB.prepare('INSERT OR IGNORE INTO waitlist (email, product, language, source) VALUES (?,?,?,?)')
          .bind(b.email, b.product || 'costimplodeai', b.language || 'en', b.source || 'web').run();
        return json({ success: true, message: 'Added to waitlist.' });
      } catch { return json({ error: 'Failed' }, 500); }
    }

    // Provider list - shows users the 3 providers
    if (url.pathname === '/api/providers' && request.method === 'GET') {
      return json({
        providers: [
          {
            id: 'costimplode_native',
            name: 'CostImplode Native',
            badge: 'RECOMMENDED',
            description: 'Our own infrastructure. API key pre-filled. Fastest & cheapest.',
            byok: false,
            api_key_included: true,
            free_models: ['ci-nano', 'ci-swift'],
            signup_required: false,
            referral_link: null,
          },
          {
            id: 'cometapi',
            name: 'CometAPI',
            badge: '500+ MODELS',
            description: 'Access GPT-5, Claude 4.6, Gemini 3, Sora 2, Veo 3.1 and 500+ more.',
            byok: true,
            api_key_included: false,
            signup_required: true,
            referral_link: 'https://cometapi.com?ref=costimplodeai',
            signup_url: 'https://cometapi.com/register',
            docs: 'https://docs.cometapi.com',
          },
          {
            id: 'aimlapi',
            name: 'AIML API',
            badge: '50K FREE/DAY',
            description: '400+ models. 50,000 free tokens daily. Best for reasoning & audio.',
            byok: true,
            api_key_included: false,
            signup_required: true,
            referral_link: 'https://aimlapi.com?ref=costimplodeai',
            signup_url: 'https://aimlapi.com/app/sign-up',
            docs: 'https://docs.aimlapi.com',
          },
        ],
      });
    }

    // ── Main inference endpoint ──────────────────────────────────────────────
    const isInference = request.method === 'POST' && (
      url.pathname === '/' ||
      url.pathname === '/v1/chat/completions' ||
      url.pathname === '/api/chat'
    );

    if (!isInference) return json({ error: 'Not found' }, 404);

    const t0 = Date.now();

    // Auth
    let uid = 'anon';
    const auth = request.headers.get('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const v = await verifyFB(token, env.FIREBASE_PROJECT_ID);
      if (v) uid = v.uid as string;
    }

    try {
      const raw = await request.json<any>();

      // Extract BYOK keys
      const cometKey = request.headers.get('x-comet-key') || raw.comet_api_key || env.COMET_API_KEY;
      const aimlKey  = request.headers.get('x-aiml-key')  || raw.aiml_api_key  || env.AIML_API_KEY;
      const selectedProvider = raw.provider || 'auto';

      // Redact PII
      if (raw.messages?.length) {
        raw.messages[raw.messages.length - 1].content = pii(raw.messages[raw.messages.length - 1].content || '');
      }

      const prompt = raw.messages?.[raw.messages.length - 1]?.content || raw.prompt || '';
      const lang   = raw.language || 'en';

      // Hindi fast path - always native, always free
      if (lang === 'hi') {
        const r = await env.AI.run('@cf/meta/llama-3.2-1b-instruct' as any, { messages: raw.messages || [{ role: 'user', content: prompt }] }) as any;
        ctx.waitUntil(DO.fetch(new Request('http://do/update', { method: 'POST', body: JSON.stringify({ provider: 'native', latency: Date.now() - t0, cacheHit: true }) })));
        return json({ response: r.response, reply: r.response, source: 'native_hindi', latency: `${Date.now() - t0}ms`, cost: 0 });
      }

      // Get best provider from DO
      const best = await (await DO.fetch(new Request('http://do/best'))).json<any>();

      // Build inference payload
      const payload = {
        model: raw.model || 'gpt-4o-mini',
        messages: raw.messages || [{ role: 'user', content: prompt }],
        max_tokens: raw.max_tokens || 2048,
        temperature: raw.temperature || 0.7,
        stream: false,
      };

      // Provider chain - Native first, then BYOK
      interface Provider {
        id: string;
        enabled: boolean;
        call: () => Promise<Response>;
        timeout: number;
      }

      const providers: Provider[] = [
        // Provider #1: CostImplode Native (platform key pre-filled)
        {
          id: 'native',
          enabled: !!env.PLATFORM_API_KEY && selectedProvider !== 'cometapi' && selectedProvider !== 'aimlapi',
          timeout: 10000,
          call: () => fetch(`${env.NATIVE_AGGREGATOR_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.PLATFORM_API_KEY}` },
            body: JSON.stringify({ ...payload, model: mapToNative(payload.model) }),
            signal: AbortSignal.timeout(10000),
          }),
        },
        // Provider #2: CometAPI (BYOK)
        {
          id: 'cometapi',
          enabled: !!cometKey && selectedProvider !== 'aimlapi',
          timeout: 12000,
          call: () => fetch(
            `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY_ID}/custom-comet/chat/completions`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cometKey}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) }
          ),
        },
        // Provider #3: AIMLAPI (BYOK)
        {
          id: 'aimlapi',
          enabled: !!aimlKey,
          timeout: 15000,
          call: () => fetch(
            `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY_ID}/custom-aimlapi/chat/completions`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aimlKey}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) }
          ),
        },
      ];

      // Sort by DO recommendation
      providers.sort((a, b) => a.id === best.best ? -1 : b.id === best.best ? 1 : 0);

      let result = ''; let source = ''; let isEmergency = false;

      for (const p of providers) {
        if (!p.enabled) continue;
        const ps = Date.now();
        try {
          const res = await p.call();
          if (!res.ok) throw new Error(`${p.id} ${res.status}`);
          const d = await res.json<any>();
          result = d.choices?.[0]?.message?.content || d.response || '';
          source = p.id;
          ctx.waitUntil(DO.fetch(new Request('http://do/update', { method: 'POST', body: JSON.stringify({ provider: p.id, latency: Date.now() - ps }) })));
          break;
        } catch (e) {
          console.error(`[${p.id}] failed:`, (e as Error).message);
          ctx.waitUntil(DO.fetch(new Request('http://do/update', { method: 'POST', body: JSON.stringify({ provider: p.id, latency: p.timeout, error: true, fallback: true }) })));
          // Log outage
          ctx.waitUntil(env.SHARD_1.prepare('INSERT INTO provider_outages (provider, error_type, requests_affected, fallback_used) VALUES (?,?,1,?)')
            .bind(p.id, (e as Error).message, 'next_provider').run());
        }
      }

      // Emergency fallback - Workers AI only if ALL providers failed
      if (!result) {
        isEmergency = true;
        console.warn('[EMERGENCY] All providers failed. Workers AI fallback activated.');
        const model = prompt.length > 200 ? '@cf/meta/llama-3.1-8b-instruct-fp8-fast' : '@cf/meta/llama-3.2-1b-instruct';
        try {
          const r = await env.AI.run(model as any, { messages: payload.messages }) as any;
          result = r.response || '';
          source = 'workers_ai_emergency';
          ctx.waitUntil(DO.fetch(new Request('http://do/update', { method: 'POST', body: JSON.stringify({ provider: 'native', latency: Date.now() - t0, emergency: true }) })));
        } catch {
          return json({ error: 'All providers temporarily unavailable. Please retry.' }, 503);
        }
      }

      // Log usage
      const iTokens = Math.ceil(prompt.length / 4);
      const oTokens = Math.ceil(result.length / 4);
      ctx.waitUntil(env.SHARD_1.prepare(
        'INSERT INTO usage_logs (uid, model, provider, input_tokens, output_tokens, latency_ms) VALUES (?,?,?,?,?,?)'
      ).bind(uid, payload.model, source, iTokens, oTokens, Date.now() - t0).run());

      // Return OpenAI-compatible
      if (url.pathname === '/v1/chat/completions') {
        return json({
          id: `chatcmpl-ci-${crypto.randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: payload.model,
          choices: [{ index: 0, message: { role: 'assistant', content: result }, finish_reason: 'stop' }],
          usage: { prompt_tokens: iTokens, completion_tokens: oTokens, total_tokens: iTokens + oTokens },
          x_costimplode: { source, latency_ms: Date.now() - t0, emergency: isEmergency },
        });
      }

      return json({ response: result, reply: result, source, latency: `${Date.now() - t0}ms`, emergency: isEmergency });

    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }
  },
};

// Map common model names to our native models
function mapToNative(model: string): string {
  const map: Record<string, string> = {
    'gpt-4o': 'ci-pro',
    'gpt-4o-mini': 'ci-standard',
    'gpt-3.5-turbo': 'ci-swift',
    'claude-haiku': 'ci-standard',
    'mistral-small': 'ci-mistral',
    'o1-mini': 'ci-reason',
    'deepseek-r1': 'ci-reason',
  };
  return map[model] || 'ci-standard';
}
