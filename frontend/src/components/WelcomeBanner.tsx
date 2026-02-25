import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Users, ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';

interface WelcomeBannerProps {
  donorCount: number;
}

const FEATURES = [
  'Track every donor with a unique log number',
  'Record money and grocery donations with ease',
  'Filter and search your full donor registry',
  'Export data to CSV or print donor records',
];

export default function WelcomeBanner({ donorCount }: WelcomeBannerProps) {
  const { identity } = useInternetIdentity();
  const { isLoggedIn, isSubAdmin } = useSubAccountAuth();
  const { data: isAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const canManageDonors = isAdmin || isSubAdmin;

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-0 print:hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 80% at 50% 40%, #fffde7 0%, #fff9c4 25%, #ffd54f 60%, #ffb300 100%)',
      }}
    >
      {/* Central radial glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 55% at 50% 38%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
        }}
      />

      {/* Decorative soft circles */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.18)' }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,193,7,0.18)' }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        {/* Top row: logo + title + donor pill */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/generated/donor-logo.dim_128x128.png"
              alt="TrustTrack"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/70"
            />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-amber-900">
                TrustTrack
              </h1>
              <p className="text-amber-700 text-sm font-medium mt-0.5">
                Donor management made simple &amp; trustworthy
              </p>
            </div>
          </div>

          {/* Donor count pill */}
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 bg-amber-900/10 border border-amber-700/30 rounded-full px-5 py-2 text-sm font-semibold text-amber-900 shadow-sm">
              <Users className="w-4 h-4 text-amber-700" />
              {donorCount} registered donor{donorCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Bullet feature list */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 list-none">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-amber-900 font-medium bg-white/40 rounded-lg px-3 py-2 border border-amber-300/40"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {canManageDonors && (
            <Button
              asChild
              size="sm"
              className="min-h-[44px] bg-amber-800 hover:bg-amber-900 text-white border-0 shadow-sm"
            >
              <Link to="/donor/add">
                <UserPlus className="w-4 h-4 mr-1.5" />
                Add Donor
              </Link>
            </Button>
          )}
          {(isAdmin || isSubAdmin) && (
            <Button
              asChild
              size="sm"
              className="min-h-[44px] bg-white/70 hover:bg-white/90 text-amber-900 border border-amber-400/60 shadow-sm"
              variant="outline"
            >
              <Link to="/admin">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Admin Panel
              </Link>
            </Button>
          )}
          {!isAuthenticated && !isLoggedIn && (
            <Button
              asChild
              size="sm"
              className="min-h-[44px] bg-amber-800 hover:bg-amber-900 text-white border-0 shadow-sm"
            >
              <Link to="/login">
                <Users className="w-4 h-4 mr-1.5" />
                Staff Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
