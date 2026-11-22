import { TrendingUp } from 'lucide-react';

// PowerInvest brand lockup, used by the sidebar and the login/signup pages.
export default function Brand({ size = 'default' }) {
  return (
    <div className={`brand ${size === 'large' ? 'brand-large' : ''}`}>
      <span className="brand-mark"><TrendingUp size={size === 'large' ? 22 : 18} strokeWidth={2.5} /></span>
      <span>power<span>invest</span></span>
    </div>
  );
}
