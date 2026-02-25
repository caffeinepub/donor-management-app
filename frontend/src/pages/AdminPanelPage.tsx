import { useState } from 'react';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import { exportDonorsToCsv } from '../utils/csvExport';
import { useGetAllDonors } from '../hooks/useQueries';
import ManageGroceryList from '../components/ManageGroceryList';
import ManageSubAccounts from '../components/ManageSubAccounts';
import CSVImportModal from '../components/CSVImportModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@tanstack/react-router';
import { ShieldCheck, Download, ShoppingBasket, Users, Upload } from 'lucide-react';

export default function AdminPanelPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const { isSubAdmin } = useSubAccountAuth();
  const { data: donors = [] } = useGetAllDonors();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const isAuthenticated = !!identity;
  const canAccess = isAdmin || isSubAdmin;

  if (adminLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground mt-3 text-sm">Checking permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated && !canAccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground mb-6">
          You need to be logged in as an admin to access this panel.
        </p>
        <Button asChild className="min-h-[44px]">
          <Link to="/">Back to Donors</Link>
        </Button>
      </div>
    );
  }

  const handleExportCsv = () => {
    exportDonorsToCsv(donors);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage grocery items, staff accounts, and donor data
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="min-h-[44px]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Donors
          </Button>
          <Button variant="outline" onClick={handleExportCsv} className="min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groceries">
        <TabsList className="mb-6">
          <TabsTrigger value="groceries" className="flex items-center gap-1.5 min-h-[44px]">
            <ShoppingBasket className="w-4 h-4" />
            Grocery Items
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="accounts" className="flex items-center gap-1.5 min-h-[44px]">
              <Users className="w-4 h-4" />
              Staff Accounts
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="groceries">
          <ManageGroceryList />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="accounts">
            <ManageSubAccounts />
          </TabsContent>
        )}
      </Tabs>

      {/* CSV Import Modal */}
      <CSVImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
