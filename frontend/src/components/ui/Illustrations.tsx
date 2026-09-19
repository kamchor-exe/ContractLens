import React from "react";

// Royalty-free custom SVG vector illustrations for ContractLens UI

export function HeroContractIllustration({ className = "w-full h-48" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="heroGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="heroGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="heroGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="shadow1" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#1e3a8a" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background Glow */}
      <circle cx="200" cy="110" r="90" fill="url(#heroGrad1)" opacity="0.08" />
      <circle cx="280" cy="70" r="50" fill="url(#heroGrad2)" opacity="0.1" />

      {/* Contract Document Card */}
      <rect x="70" y="30" width="160" height="160" rx="14" fill="#ffffff" filter="url(#shadow1)" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Document Header */}
      <rect x="90" y="50" width="80" height="10" rx="5" fill="url(#heroGrad1)" />
      <rect x="90" y="70" width="120" height="6" rx="3" fill="#cbd5e1" />
      <rect x="90" y="84" width="100" height="6" rx="3" fill="#e2e8f0" />

      {/* Clause highlights */}
      <rect x="90" y="102" width="120" height="24" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
      <rect x="98" y="111" width="60" height="6" rx="3" fill="#2563eb" />
      <circle cx="198" cy="114" r="5" fill="#10b981" />

      <rect x="90" y="134" width="120" height="24" rx="6" fill="#fef3c7" stroke="#fde68a" strokeWidth="1" />
      <rect x="98" y="143" width="70" height="6" rx="3" fill="#d97706" />

      {/* Lens / magnifying AI glass floating */}
      <g transform="translate(190, 60)">
        <circle cx="50" cy="50" r="42" fill="#ffffff" filter="url(#shadow1)" stroke="url(#heroGrad2)" strokeWidth="4" />
        <circle cx="50" cy="50" r="32" fill="url(#heroGrad2)" opacity="0.15" />
        <path d="M40 42 L50 32 L60 42 M50 32 L50 68" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="68" r="4" fill="#6366f1" />
        <path d="M78 78 L105 105" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* Badge Floating Elements */}
      <g transform="translate(250, 130)" filter="url(#shadow1)">
        <rect x="0" y="0" width="110" height="42" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        <circle cx="20" cy="21" r="10" fill="url(#heroGrad3)" />
        <path d="M16 21 L19 24 L25 18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="36" y="13" width="55" height="6" rx="3" fill="#334155" />
        <rect x="36" y="23" width="40" height="5" rx="2.5" fill="#94a3b8" />
      </g>
    </svg>
  );
}

export function AIIntelligenceIllustration({ className = "w-full h-40" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aiGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Outer Pulse Rings */}
      <circle cx="160" cy="90" r="70" stroke="url(#aiGrad1)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
      <circle cx="160" cy="90" r="50" fill="url(#aiGrad1)" opacity="0.1" />

      {/* Central AI Node */}
      <circle cx="160" cy="90" r="32" fill="#ffffff" stroke="url(#aiGrad1)" strokeWidth="3" filter="drop-shadow(0 4px 10px rgba(99,102,241,0.2))" />
      <path d="M148 90 H172 M160 78 V102 M152 82 L168 98 M168 82 L152 98" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Satellites */}
      <circle cx="80" cy="60" r="14" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
      <path d="M80 60 L130 80" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" />
      
      <circle cx="240" cy="60" r="14" fill="#fdf2f8" stroke="#ec4899" strokeWidth="2" />
      <path d="M240 60 L190 80" stroke="#fbcfe8" strokeWidth="1.5" strokeDasharray="3 3" />

      <circle cx="100" cy="140" r="14" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
      <path d="M100 140 L138 108" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="3 3" />

      <circle cx="220" cy="140" r="14" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
      <path d="M220 140 L182 108" stroke="#fde68a" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}

export function SecurityShieldIllustration({ className = "w-full h-36" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      
      <path d="M140 20 L200 45 V90 C200 125 140 145 140 145 C140 145 80 125 80 90 V45 L140 20 Z" fill="url(#shieldGrad)" opacity="0.15" />
      <path d="M140 30 L190 52 V90 C190 118 140 135 140 135 C140 135 90 118 90 90 V52 L140 30 Z" fill="#ffffff" stroke="url(#shieldGrad)" strokeWidth="3" />
      
      {/* Lock icon inside shield */}
      <rect x="125" y="80" width="30" height="24" rx="4" fill="url(#shieldGrad)" />
      <path d="M131 80 V72 C131 66 149 66 149 72 V80" stroke="url(#shieldGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="140" cy="90" r="3" fill="#ffffff" />
    </svg>
  );
}
