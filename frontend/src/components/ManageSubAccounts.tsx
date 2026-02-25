import { useState } from 'react';
import { toast } from 'sonner';
import { useListSubAccounts, useCreateSubAccount, useDeleteSubAccount } from '../hooks/useQueries';
import { Role } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Users, ShieldCheck, Eye } from 'lucide-react';

// SHA-256 hash
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ManageSubAccounts() {
  const { data: subAccounts = [], isLoading } = useListSubAccounts();
  const createSubAccount = useCreateSubAccount();
  const deleteSubAccount = useDeleteSubAccount();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.user);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Username and password are required');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const passwordHash = await hashPassword(password);
      await createSubAccount.mutateAsync({ username: username.trim(), passwordHash, role });
      toast.success(`Account "${username.trim()}" created successfully`);
      setUsername('');
      setPassword('');
      setRole(Role.user);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create account');
    }
  };

  const handleDelete = async (uname: string) => {
    try {
      await deleteSubAccount.mutateAsync(uname);
      toast.success(`Account "${uname}" deleted`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create new account */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Create Staff Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sub-username">Username</Label>
                <Input
                  id="sub-username"
                  placeholder="e.g. volunteer1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={createSubAccount.isPending}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-password">Password</Label>
                <Input
                  id="sub-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createSubAccount.isPending}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="sub-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.admin}>
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Admin — Full access
                    </span>
                  </SelectItem>
                  <SelectItem value={Role.user}>
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      User — Record donations only
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createSubAccount.isPending} className="w-full sm:w-auto">
              {createSubAccount.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Staff Accounts ({subAccounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Loading accounts...</div>
          ) : subAccounts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No staff accounts yet. Create one above.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {subAccounts.map((account) => (
                <li key={account.username} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary uppercase">
                        {account.username[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{account.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={account.role === Role.admin ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {account.role === Role.admin ? (
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> User
                        </span>
                      )}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deleteSubAccount.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the account for{' '}
                            <strong>{account.username}</strong>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.username)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
