import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useGetAllDonors, useIsCallerAdmin } from '../hooks/useQueries';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { exportDonorsToCsv } from '../utils/csvExport';
import RecordDonationModal from '../components/RecordDonationModal';
import WelcomeBanner from '../components/WelcomeBanner';
import EmptyState from '../components/EmptyState';
import type { Donor } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  MapPin,
  Search,
  Download,
  Printer,
  ClipboardList,
  DollarSign,
  ShoppingBasket,
  Calendar,
  Users,
} from 'lucide-react';

export default function DonorListPage() {
  const { data: donors = [], isLoading } = useGetAllDonors();
  const { data: isAdmin } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const { isLoggedIn, isSubUser, isSubAdmin } = useSubAccountAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [placeFilter, setPlaceFilter] = useState('all');
  const [recordingDonorId, setRecordingDonorId] = useState<number | null>(null);

  const isAuthenticated = !!identity;
  const canManageDonors = isAdmin || isSubAdmin;
  const canRecordDonation = isLoggedIn && isSubUser;

  // Unique places for filter
  const places = Array.from(new Set(donors.map((d) => d.place).filter(Boolean))).sort();

  const filtered = donors.filter((d) => {
    const matchesSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.address.toLowerCase().includes(search.toLowerCase()) ||
      d.place.toLowerCase().includes(search.toLowerCase()) ||
      String(d.logNumber).includes(search);
    const matchesPlace = placeFilter === 'all' || d.place === placeFilter;
    return matchesSearch && matchesPlace;
  });

  const recordingDonor = recordingDonorId !== null ? donors.find((d) => d.logNumber === recordingDonorId) : null;

  const handleExportCsv = () => {
    exportDonorsToCsv(donors);
  };

  const formatDonationType = (donor: Donor) => {
    const dt = donor.initialDonationType;
    if (dt.__kind__ === 'money') {
      return { label: `$${dt.money}`, icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-green-600' };
    }
    return {
      label: `${dt.groceries.length} item${dt.groceries.length !== 1 ? 's' : ''}`,
      icon: <ShoppingBasket className="w-3.5 h-3.5" />,
      color: 'text-amber-600',
    };
  };

  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── TOP SECTION: Hero / Welcome Banner ─────────────────────────── */}
      <section className="px-4 pt-8 pb-0 print:hidden">
        <WelcomeBanner donorCount={donors.length} />
      </section>

      {/* Wave / visual separator */}
      <div className="relative h-10 overflow-hidden print:hidden" aria-hidden="true">
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"
            fill="white"
          />
        </svg>
        {/* Amber wave behind the white one for depth */}
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,10 C480,35 960,5 1440,25 L1440,40 L0,40 Z"
            fill="#ffd54f"
          />
        </svg>
      </div>

      {/* ── MID SECTION: Donor Registry ────────────────────────────────── */}
      <section className="bg-white px-4 pb-10 pt-2 rounded-t-none shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        {/* Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <div>
            <h2 className="text-xl font-bold font-heading text-foreground">Donor Registry</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {filtered.length} of {donors.length} donor{donors.length !== 1 ? 's' : ''}
              {(search || placeFilter !== 'all') ? ' shown' : ' registered'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageDonors && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCsv} className="min-h-[44px]">
                  <Download className="w-4 h-4 mr-1.5" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="min-h-[44px]">
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print
                </Button>
                <Button asChild size="sm" className="min-h-[44px]">
                  <Link to="/donor/add">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add Donor
                  </Link>
                </Button>
              </>
            )}
            {!isAuthenticated && !isLoggedIn && (
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <Link to="/login">
                  <Users className="w-4 h-4 mr-1.5" />
                  Staff Login
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, place or log #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 min-h-[44px]"
            />
          </div>
          <Select value={placeFilter} onValueChange={setPlaceFilter}>
            <SelectTrigger className="w-full sm:w-52 min-h-[44px]">
              <MapPin className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Filter by place" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Places</SelectItem>
              {places.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={<UserPlus className="w-9 h-9 text-muted-foreground" />}
            title={search || placeFilter !== 'all' ? 'No donors match your search' : 'No donors yet'}
            description={
              search || placeFilter !== 'all'
                ? "Try adjusting your search or filter to find what you're looking for."
                : 'Get started by adding your first donor to the registry.'
            }
            buttonText={canManageDonors && !search && placeFilter === 'all' ? 'Add First Donor' : undefined}
            onButtonClick={canManageDonors && !search && placeFilter === 'all' ? () => navigate({ to: '/donor/add' }) : undefined}
          />
        )}

        {/* Donor grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
            {filtered.map((donor) => {
              const dt = formatDonationType(donor);
              return (
                <div
                  key={donor.logNumber}
                  className="bg-card border border-border rounded-xl p-4 shadow-card hover:shadow-md transition-shadow flex flex-col gap-3"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to="/donor/$logNumber"
                        params={{ logNumber: String(donor.logNumber) }}
                        className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {donor.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Log #{donor.logNumber}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      <MapPin className="w-3 h-3 mr-1" />
                      {donor.place || 'N/A'}
                    </Badge>
                  </div>

                  {/* Address */}
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {donor.addressNumber} {donor.address}
                  </p>

                  {/* Donation type */}
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${dt.color}`}>
                    {dt.icon}
                    {dt.label}
                  </div>

                  {/* Date + donation count */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(donor.addedDate)}
                    </span>
                    {donor.donations.length > 0 && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {donor.donations.length} record{donor.donations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto print:hidden">
                    <Button asChild variant="outline" size="sm" className="flex-1 min-h-[44px]">
                      <Link to="/donor/$logNumber" params={{ logNumber: String(donor.logNumber) }}>
                        View Details
                      </Link>
                    </Button>
                    {canRecordDonation && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 min-h-[44px]"
                        onClick={() => setRecordingDonorId(donor.logNumber)}
                      >
                        <ClipboardList className="w-3.5 h-3.5 mr-1" />
                        Record
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Record Donation Modal */}
      {recordingDonor && (
        <RecordDonationModal
          donorId={recordingDonor.logNumber}
          donorName={recordingDonor.name}
          open={recordingDonorId !== null}
          onClose={() => setRecordingDonorId(null)}
        />
      )}
    </div>
  );
}
