import type { Donor } from '../backend';

function formatDonationType(donor: Donor): { type: string; amount: string; groceries: string } {
  const dt = donor.initialDonationType;
  if (dt.__kind__ === 'money') {
    return { type: 'Money', amount: String(dt.money), groceries: '' };
  } else {
    const items = dt.groceries
      .map((g) => (g.quantity ? `${g.name} (${g.quantity})` : g.name))
      .join('; ');
    return { type: 'Groceries', amount: '', groceries: items };
  }
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDonationHistory(donor: Donor): string {
  if (!donor.donations || donor.donations.length === 0) return '';
  return donor.donations
    .map((d) => {
      const date = formatDate(d.timestamp);
      const by = d.submittedBy;
      let detail = '';
      if (d.donationType.__kind__ === 'money') {
        detail = `$${d.donationType.money}`;
      } else {
        detail = d.donationType.groceries.map((g) => g.name).join(', ');
      }
      return `${date} by ${by}: ${detail}${d.notes ? ` (${d.notes})` : ''}`;
    })
    .join(' | ');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportDonorsToCsv(donors: Donor[], filename = 'trusttrack-donors.csv') {
  const headers = [
    'Log Number',
    'Name',
    'Address',
    'Address Number',
    'Place',
    'Added Date',
    'Initial Donation Type',
    'Initial Amount',
    'Initial Groceries',
    'Notes',
    'Maps Link',
    'Total Donation Records',
    'Donation History',
  ];

  const rows = donors.map((donor) => {
    const { type, amount, groceries } = formatDonationType(donor);
    return [
      String(donor.logNumber),
      donor.name,
      donor.address,
      donor.addressNumber,
      donor.place,
      formatDate(donor.addedDate),
      type,
      amount,
      groceries,
      donor.notes,
      donor.mapLink || '',
      String(donor.donations?.length ?? 0),
      formatDonationHistory(donor),
    ].map(escapeCsv);
  });

  const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');

  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
