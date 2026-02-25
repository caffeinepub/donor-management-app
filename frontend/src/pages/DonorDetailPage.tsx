import { useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useGetDonor, useDeleteDonor, useIsCallerAdmin } from '../hooks/useQueries';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import MapPreviewDrawer from '../components/MapPreviewDrawer';
import RecordDonationModal from '../components/RecordDonationModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBasket,
  FileText,
  Map,
  Printer,
  ClipboardList,
  User,
  Hash,
} from 'lucide-react';

export default function DonorDetailPage() {
  const { logNumber } = useParams({ from: '/donor/$logNumber' });
  const navigate = useNavigate();
  const donorId = parseInt(logNumber, 10);

  const { data: donor, isLoading } = useGetDonor(donorId);
  const { data: isAdmin } = useIsCallerAdmin();
  const { isSubAdmin, isSubUser } = useSubAccountAuth();
  const deleteDonor = useDeleteDonor();

  const [mapOpen, setMapOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  const canManage = isAdmin || isSubAdmin;
  const canRecord = isSubUser;

  const handleDelete = async () => {
    try {
      await deleteDonor.mutateAsync(donorId);
      toast.success('Donor deleted successfully');
      navigate({ to: '/' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete donor');
    }
  };

  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Donor not found</h2>
        <p className="text-muted-foreground mb-4">This donor may have been deleted.</p>
        <Button asChild variant="outline">
          <Link to="/">Back to Donors</Link>
        </Button>
      </div>
    );
  }

  const dt = donor.initialDonationType;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
          {donor.mapLink && (
            <Button variant="outline" size="sm" onClick={() => setMapOpen(true)}>
              <Map className="w-4 h-4 mr-1.5" />
              View on Map
            </Button>
          )}
          {canRecord && (
            <Button size="sm" onClick={() => setRecordOpen(true)}>
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Record Donation
            </Button>
          )}
          {canManage && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/donor/$logNumber/edit" params={{ logNumber: String(donor.logNumber) }}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleteDonor.isPending}>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Donor</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{donor.name}</strong>? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Donor card */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Header band */}
        <div className="bg-primary/10 px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold font-heading text-foreground">{donor.name}</h1>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                Log Number {donor.logNumber}
              </p>
            </div>
            <Badge variant="outline" className="text-sm flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {donor.place || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Details grid */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</p>
            <p className="text-sm font-medium flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {donor.addressNumber} {donor.address}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Added Date</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              {formatDate(donor.addedDate)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Initial Donation Type
            </p>
            {dt.__kind__ === 'money' ? (
              <p className="text-sm font-medium flex items-center gap-1.5 text-green-700 dark:text-green-400">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                Money — ${dt.money}
              </p>
            ) : (
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-1">
                  <ShoppingBasket className="w-4 h-4 flex-shrink-0" />
                  Groceries
                </p>
                <ul className="text-sm text-muted-foreground space-y-0.5 ml-5 list-disc">
                  {dt.groceries.map((g, i) => (
                    <li key={i}>
                      {g.name}
                      {g.quantity ? ` — ${g.quantity}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {donor.notes && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground flex items-start gap-1.5">
                <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                {donor.notes}
              </p>
            </div>
          )}

          {donor.mapLink && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</p>
              <button
                onClick={() => setMapOpen(true)}
                className="text-sm text-primary hover:underline flex items-center gap-1.5 print:hidden"
              >
                <Map className="w-4 h-4 flex-shrink-0" />
                View on Google Maps
              </button>
              <p className="hidden print:block text-sm text-muted-foreground break-all">{donor.mapLink}</p>
            </div>
          )}
        </div>

        {/* Donation history */}
        {donor.donations.length > 0 && (
          <>
            <Separator />
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Donation History ({donor.donations.length})
              </h2>
              <div className="space-y-3">
                {donor.donations.map((d, i) => (
                  <div
                    key={i}
                    className="bg-muted/50 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {d.donationType.__kind__ === 'money' ? (
                          <span className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />${d.donationType.money}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <ShoppingBasket className="w-3.5 h-3.5" />
                            {d.donationType.groceries.map((g) => g.name).join(', ')}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {d.submittedBy}
                        </span>
                      </div>
                      {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDateShort(d.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Map Drawer */}
      {donor.mapLink && (
        <MapPreviewDrawer
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          mapLink={donor.mapLink}
          donorName={donor.name}
        />
      )}

      {/* Record Donation Modal */}
      <RecordDonationModal
        donorId={donor.logNumber}
        donorName={donor.name}
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
      />
    </div>
  );
}
