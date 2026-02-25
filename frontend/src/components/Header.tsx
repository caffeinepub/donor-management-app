import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, ShieldCheck, Users } from 'lucide-react';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { isLoggedIn, username, logout: subLogout } = useSubAccountAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleSubLogout = () => {
    subLogout();
    navigate({ to: '/' });
  };

  return (
    <header className="bg-header-bg border-b border-header-border shadow-sm print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <img
            src="/assets/generated/donor-logo.dim_128x128.png"
            alt="TrustTrack Logo"
            className="w-9 h-9 rounded-lg object-cover"
          />
          <span className="text-xl font-bold font-heading text-header-fg tracking-tight group-hover:text-primary transition-colors">
            TrustTrack
          </span>
        </Link>

        {/* Nav as bullet list */}
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-1 flex-wrap list-disc list-inside marker:text-amber-500">
            {/* Donors */}
            <li className="flex items-center">
              <Link
                to="/"
                className="min-h-[44px] px-3 py-2 rounded-md text-sm font-medium text-header-fg hover:bg-header-hover transition-colors flex items-center gap-1.5"
              >
                Donors
              </Link>
            </li>

            {/* Admin Panel — visible to admins and authenticated users */}
            {(isAdmin || isAuthenticated) && (
              <li className="flex items-center">
                <Link
                  to="/admin"
                  className="min-h-[44px] px-3 py-2 rounded-md text-sm font-medium text-header-fg hover:bg-header-hover transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
              </li>
            )}

            {/* Sub-account session indicator */}
            {isLoggedIn && (
              <li className="flex items-center gap-2 ml-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3 py-2 rounded-full min-h-[44px]">
                  <Users className="w-3.5 h-3.5" />
                  {username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSubLogout}
                  className="min-h-[44px] text-header-fg/70 hover:text-destructive hover:bg-destructive/10"
                  title="Staff Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </li>
            )}

            {/* Staff Login — only when not logged in */}
            {!isLoggedIn && !isAuthenticated && (
              <li className="flex items-center">
                <Link
                  to="/login"
                  className="min-h-[44px] px-3 py-2 rounded-md text-sm font-medium text-header-fg hover:bg-header-hover transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  Staff Login
                </Link>
              </li>
            )}

            {/* Internet Identity admin login/logout */}
            <li className="flex items-center ml-1">
              <Button
                variant={isAuthenticated ? 'outline' : 'default'}
                size="sm"
                onClick={handleAuth}
                disabled={isLoggingIn}
                className="min-h-[44px]"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : isAuthenticated ? (
                  <span className="flex items-center gap-1.5">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <LogIn className="w-4 h-4" />
                    Admin Login
                  </span>
                )}
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
