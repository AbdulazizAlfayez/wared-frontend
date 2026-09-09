import { ShieldCheck } from 'lucide-react';

type VerificationLevel = 'none' | 'email' | 'phone' | 'identity' | 'business' | 'full' | string;

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<string, { label: string; className: string } | null> = {
  none:     null,
  email:    null,
  phone:    { label: 'Phone Verified',     className: 'text-gray-400' },
  identity: { label: 'Verified',           className: 'text-green-500' },
  business: { label: 'Licensed Business',  className: 'text-blue-500' },
  full:     { label: 'Fully Verified',     className: 'text-amber-500' },
};

export default function VerificationBadge({ level, size = 'md' }: VerificationBadgeProps) {
  const config = BADGE_CONFIG[level] ?? null;
  if (!config) return null;

  if (size === 'sm') {
    return (
      <span title={config.label} className="inline-flex flex-shrink-0">
        <ShieldCheck className={`${config.className}`} size={14} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.className}`}>
      <ShieldCheck size={14} />
      {config.label}
    </span>
  );
}
