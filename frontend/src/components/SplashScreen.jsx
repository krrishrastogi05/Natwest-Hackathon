import React, { useState } from 'react';
import { ArrowRight, Shield, FlaskConical, CheckCircle2, Play, BarChart3, Sparkles } from 'lucide-react';

const DEMO_VIDEO_SRC = '/demo.mp4';
const DEMO_VIDEO_FALLBACK = 'https://github.com/user-attachments/assets/936c42e9-4a5b-4fc3-8b03-3b8ef8cbb8db';
const DEMO_POSTER = '';

const HIGHLIGHT_CARDS = [
  {
    icon: Shield,
    accent: '#10b981',
    label: 'Security First',
    headline: 'Zero-trust by default',
    body: 'End-to-end data masking, sensitive-column detection, audit trails, and real-time compliance guardrails on every query.',
  },
  {
    icon: FlaskConical,
    accent: '#6366f1',
    label: 'Python ML Engine',
    headline: 'Full analytics power',
    body: 'Sandboxed Python with pandas, scikit-learn & matplotlib. Run regressions, clustering and forecasts — no code needed.',
  },
  {
    icon: CheckCircle2,
    accent: '#f43f5e',
    label: 'Compliance Ready',
    headline: 'Regulatory out of the box',
    body: 'PMLA / AML, KYC / CDD, DPDP Act 2023 and IRAC norms — every response validated against live compliance rules.',
  },
];

const SECONDARY = ['Natural-Language SQL', 'Interactive Charts', 'PDF Audit Reports', 'Web Search', 'Schema Explorer'];

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoErr, setVideoErr] = useState(false);

  const handleOpen = () => {
    setFadeOut(true);
    setTimeout(() => onComplete(), 500);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

    .lp-root {
      position: fixed; inset: 0; z-index: 100;
      background: #09090b;
      font-family: 'Inter', sans-serif;
      color: #f4f4f5;
      overflow-y: auto;
      transition: opacity 0.5s ease;
    }
    .lp-root.lp-out { opacity: 0; pointer-events: none; }

    /* Subtle background glow behind the video center */
    .lp-glow {
      position: fixed;
      top: 35%; left: 50%;
      transform: translate(-50%, -50%);
      width: 800px; height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.05) 45%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    .lp-wrap {
      position: relative; z-index: 1;
      max-width: 1100px; margin: 0 auto;
      padding: 0 24px 64px;
      box-sizing: border-box;
    }

    /* ── Nav ── */
    .lp-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px 0 20px;
    }
    .lp-brand { display: flex; align-items: center; gap: 12px; }
    .lp-brand-mark {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .lp-brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 22px; font-weight: 800; letter-spacing: -0.03em; color: #fff;
    }
    .lp-team {
      font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: #a1a1aa; background: #18181b; border: 1px solid #27272a;
      padding: 6px 14px; border-radius: 99px;
    }

    /* ── Header / Intro ── */
    .lp-header {
      text-align: center;
      max-width: 760px;
      margin: 32px auto 40px;
    }

    .lp-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 99px; margin-bottom: 20px;
      border: 1px solid rgba(99, 102, 241, 0.3);
      background: rgba(99, 102, 241, 0.08);
      font-size: 12px; font-weight: 600; color: #818cf8; letter-spacing: 0.01em;
    }

    .lp-h1 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: clamp(40px, 5vw, 64px);
      font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; margin: 0 0 18px;
      color: #ffffff;
    }
    .lp-h1 .g {
      background: linear-gradient(120deg, #818cf8 0%, #c084fc 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .lp-tagline {
      font-size: clamp(15px, 1.3vw, 18px); font-weight: 400; line-height: 1.6;
      color: #a1a1aa; max-width: 640px; margin: 0 auto 28px;
    }
    .lp-tagline strong { color: #f4f4f5; font-weight: 600; }

    .lp-cta-row { display: flex; align-items: center; justify-content: center; gap: 14px; }
    .lp-cta {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 32px; border-radius: 99px; border: none; cursor: pointer;
      background: #6366f1; color: #fff;
      font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
      transition: all 0.2s ease;
    }
    .lp-cta:hover { transform: translateY(-2px); background: #4f46e5; box-shadow: 0 12px 32px rgba(99, 102, 241, 0.45); }
    .lp-cta .arr { transition: transform 0.2s; }
    .lp-cta:hover .arr { transform: translateX(4px); }
    
    /* ── Hero Video (Centerpiece) ── */
    .lp-hero-video-container {
      max-width: 960px;
      margin: 0 auto 56px;
    }
    .lp-video-frame {
      position: relative;
      border-radius: 16px;
      border: 1px solid #27272a;
      background: #18181b;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05);
      overflow: hidden;
    }
    .lp-video-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; background: #0f0f11;
      border-bottom: 1px solid #27272a;
    }
    .lp-video-bar i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .lp-video-bar .r { background: #ef4444; } .lp-video-bar .y { background: #f59e0b; } .lp-video-bar .gn { background: #10b981; }
    .lp-video-bar span {
      margin-left: 8px; font-size: 12px; color: #71717a; font-weight: 500; font-family: monospace;
    }
    .lp-video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; object-fit: cover; }
    .lp-video-fallback {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
      width: 100%; aspect-ratio: 16 / 9; background: #09090b;
      text-align: center; padding: 24px;
    }
    .lp-video-fallback .pl {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #27272a; color: #fff;
    }
    .lp-video-fallback p { font-size: 13px; color: #a1a1aa; max-width: 320px; line-height: 1.5; }
    .lp-video-fallback code { color: #818cf8; font-size: 12px; }

    /* ── Feature cards ── */
    .lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
    .lp-card {
      border-radius: 14px; border: 1px solid #27272a;
      background: #121215; padding: 22px; text-align: left;
      transition: all 0.2s ease;
    }
    .lp-card:hover { background: #18181b; border-color: #3f3f46; transform: translateY(-2px); }
    .lp-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .lp-card-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lp-card-chip {
      font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 3px 8px; border-radius: 6px; border: 1px solid;
    }
    .lp-card-headline { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 8px; color: #f4f4f5; }
    .lp-card-body { font-size: 13px; color: #71717a; line-height: 1.55; }

    /* ── Secondary pills ── */
    .lp-secondary { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .lp-pill {
      font-size: 12px; font-weight: 500; color: #a1a1aa;
      padding: 6px 14px; border-radius: 99px; border: 1px solid #27272a;
      background: #121215; transition: all 0.2s;
    }
    .lp-pill:hover { color: #f4f4f5; border-color: #3f3f46; }

    /* ── Animations ── */
    .a { animation: lp-up 0.5s ease-out both; }
    @keyframes lp-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 820px) {
      .lp-cards { grid-template-columns: 1fr; }
      .lp-header { margin-top: 16px; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className={`lp-root${fadeOut ? ' lp-out' : ''}`}>
        <div className="lp-glow" />

        <div className="lp-wrap">
          {/* Nav */}
          <nav className="lp-nav a">
            <div className="lp-brand">
              <div className="lp-brand-mark"><BarChart3 size={20} color="#fff" /></div>
              <span className="lp-brand-name">DataTalk</span>
            </div>
            <span className="lp-team">Swords of Summer</span>
          </nav>

          {/* Header Section */}
          <div className="lp-header a" style={{ animationDelay: '0.05s' }}>
            <div className="lp-badge">
              <Sparkles size={13} />
              AI-Powered Analytics & Compliance Engine
            </div>
            <h1 className="lp-h1">Talk to your <span className="g">Data.</span></h1>
            <p className="lp-tagline">
              Run complex analytics, ML models &amp; compliance checks —{' '}
              <strong>without writing a single line of code.</strong>
            </p>
            <div className="lp-cta-row">
              <button className="lp-cta" onClick={handleOpen}>
                Launch Platform <ArrowRight size={16} className="arr" />
              </button>
            </div>
          </div>

          {/* Video Centerpiece */}
          <div className="lp-hero-video-container a" style={{ animationDelay: '0.12s' }}>
            <div className="lp-video-frame" id="demo">
              <div className="lp-video-bar">
                <i className="r" /><i className="y" /><i className="gn" />
                <span>datatalk-demo-overview.mp4</span>
              </div>
              {videoErr ? (
                <div className="lp-video-fallback">
                  <div className="pl"><Play size={22} /></div>
                  <p>
                    Demo video file missing. Place your file at{' '}
                    <code>frontend/public/demo.mp4</code>
                  </p>
                </div>
              ) : (
                <video
                  className="lp-video"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={DEMO_POSTER || undefined}
                  onError={(e) => {
                    if (e.currentTarget.src.indexOf(DEMO_VIDEO_FALLBACK) === -1) {
                      e.currentTarget.src = DEMO_VIDEO_FALLBACK;
                    } else {
                      setVideoErr(true);
                    }
                  }}
                >
                  <source src={DEMO_VIDEO_SRC} type="video/mp4" />
                </video>
              )}
            </div>
          </div>

          {/* Feature cards */}
          <div className="lp-cards a" style={{ animationDelay: '0.18s' }}>
            {HIGHLIGHT_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="lp-card">
                  <div className="lp-card-top">
                    <div className="lp-card-icon" style={{ background: `${c.accent}15`, border: `1px solid ${c.accent}30` }}>
                      <Icon size={16} style={{ color: c.accent }} />
                    </div>
                    <span className="lp-card-chip" style={{ color: c.accent, borderColor: `${c.accent}30`, background: `${c.accent}10` }}>
                      {c.label}
                    </span>
                  </div>
                  <div className="lp-card-headline">{c.headline}</div>
                  <div className="lp-card-body">{c.body}</div>
                </div>
              );
            })}
          </div>

          {/* Secondary pills */}
          <div className="lp-secondary a" style={{ animationDelay: '0.24s' }}>
            {SECONDARY.map((s) => <span key={s} className="lp-pill">{s}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}
