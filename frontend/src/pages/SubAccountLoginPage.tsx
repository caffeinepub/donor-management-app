import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuthenticateSubAccount } from '../hooks/useQueries';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import { Role } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Lock, Eye, EyeOff } from 'lucide-react';

// Simple hash function for passwords (SHA-256 via Web Crypto)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SubAccountLoginPage() {
  const navigate = useNavigate();
  const { login } = useSubAccountAuth();
  const authenticate = useAuthenticateSubAccount();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      const passwordHash = await hashPassword(password);
      const role = await authenticate.mutateAsync({ username: username.trim(), passwordHash });

      if (role === null || role === undefined) {
        toast.error('Invalid username or password');
        return;
      }

      login(username.trim(), role as Role);
      toast.success(`Welcome back, ${username.trim()}!`);
      navigate({ to: '/' });
    } catch (err) {
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Staff Login</CardTitle>
          <CardDescription>Sign in to your TrustTrack staff account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={authenticate.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={authenticate.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={authenticate.isPending}>
              {authenticate.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Staff accounts are created by the main administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
