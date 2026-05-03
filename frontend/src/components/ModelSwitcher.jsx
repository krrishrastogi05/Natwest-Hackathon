import React, { useState } from 'react';

function ClaudeLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 7v10l8 5 8-5V7L12 2z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12 6l-5 3v6l5 3 5-3V9l-5-3z"
        fill="var(--bg-card)"
        opacity="0.6"
      />
    </svg>
  );
}

function GeminiLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 C12 7 17 12 22 12 C17 12 12 17 12 22 C12 17 7 12 2 12 C7 12 12 7 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

const MODELS = [
  { id: 'claude', label: 'Claude Opus 4.6', Logo: ClaudeLogo, activeColor: '#a855f7' },
  { id: 'gemini', label: 'Gemini 2.5 Pro',  Logo: GeminiLogo, activeColor: '#3b82f6' },
];

export default function ModelSwitcher() {
  const [active, setActive] = useState('claude');

  return (
    <div className="model-switcher" title="Switch AI model (visual only)">
      {MODELS.map(({ id, label, Logo, activeColor }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            className={`model-pill${isActive ? ' active' : ''}`}
            style={isActive ? { '--model-active-color': activeColor } : {}}
            onClick={() => setActive(id)}
            title={label}
          >
            <Logo />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
