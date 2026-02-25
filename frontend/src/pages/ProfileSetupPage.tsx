import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from 'lucide-react';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const saveProfile = useSaveCallerUserProfile();
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success('Profile saved!');
      navigate({ to: '/' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <User className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Welcome to TrustTrack</CardTitle>
          <CardDescription>Please enter your name to complete your profile setup.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Your Name</Label>
              <Input
                id="profile-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saveProfile.isPending}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
