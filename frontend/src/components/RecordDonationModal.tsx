import { useState } from 'react';
import { toast } from 'sonner';
import { useAddDonationRecord, useGetGroceryItems } from '../hooks/useQueries';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import type { DonorId, DonationEntry, GroceryItem } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, ShoppingBasket, ClipboardList } from 'lucide-react';

interface Props {
  donorId: DonorId;
  donorName: string;
  open: boolean;
  onClose: () => void;
}

export default function RecordDonationModal({ donorId, donorName, open, onClose }: Props) {
  const { username } = useSubAccountAuth();
  const addDonation = useAddDonationRecord();
  const { data: groceryItems = [] } = useGetGroceryItems();

  const [donationType, setDonationType] = useState<'money' | 'groceries'>('money');
  const [amount, setAmount] = useState('');
  const [selectedGroceries, setSelectedGroceries] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const toggleGrocery = (item: string) => {
    setSelectedGroceries((prev) => {
      const next = { ...prev };
      if (next[item] !== undefined) {
        delete next[item];
      } else {
        next[item] = '';
      }
      return next;
    });
  };

  const setGroceryQty = (item: string, qty: string) => {
    setSelectedGroceries((prev) => ({ ...prev, [item]: qty }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let dt: DonationEntry['donationType'];
    if (donationType === 'money') {
      const parsed = parseInt(amount, 10);
      if (isNaN(parsed) || parsed <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      dt = { __kind__: 'money', money: parsed };
    } else {
      const groceries: GroceryItem[] = Object.entries(selectedGroceries).map(([name, qty]) => ({
        name,
        quantity: qty || undefined,
      }));
      if (groceries.length === 0) {
        toast.error('Please select at least one grocery item');
        return;
      }
      dt = { __kind__: 'groceries', groceries };
    }

    const entry: DonationEntry = {
      donationType: dt,
      notes: notes.trim(),
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      submittedBy: username || 'unknown',
    };

    try {
      await addDonation.mutateAsync({ donorId, donationEntry: entry });
      toast.success('Donation recorded successfully!');
      setAmount('');
      setSelectedGroceries({});
      setNotes('');
      setDonationType('money');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record donation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Record Donation
          </DialogTitle>
          <DialogDescription>
            Recording donation for <strong>{donorName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Donation type */}
          <div className="space-y-2">
            <Label>Donation Type</Label>
            <RadioGroup
              value={donationType}
              onValueChange={(v) => setDonationType(v as 'money' | 'groceries')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="money" id="dt-money" />
                <Label htmlFor="dt-money" className="flex items-center gap-1 cursor-pointer">
                  <DollarSign className="w-4 h-4 text-green-600" /> Money
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="groceries" id="dt-groceries" />
                <Label htmlFor="dt-groceries" className="flex items-center gap-1 cursor-pointer">
                  <ShoppingBasket className="w-4 h-4 text-amber-600" /> Groceries
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Money amount */}
          {donationType === 'money' && (
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  disabled={addDonation.isPending}
                />
              </div>
            </div>
          )}

          {/* Grocery items */}
          {donationType === 'groceries' && (
            <div className="space-y-2">
              <Label>Select Grocery Items</Label>
              {groceryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grocery items available.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {groceryItems.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Checkbox
                        id={`grocery-${item}`}
                        checked={selectedGroceries[item] !== undefined}
                        onCheckedChange={() => toggleGrocery(item)}
                        disabled={addDonation.isPending}
                      />
                      <Label htmlFor={`grocery-${item}`} className="flex-1 cursor-pointer text-sm">
                        {item}
                      </Label>
                      {selectedGroceries[item] !== undefined && (
                        <Input
                          type="text"
                          placeholder="Qty"
                          value={selectedGroceries[item]}
                          onChange={(e) => setGroceryQty(item, e.target.value)}
                          className="w-20 h-7 text-xs"
                          disabled={addDonation.isPending}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="rec-notes">Notes (optional)</Label>
            <Textarea
              id="rec-notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={addDonation.isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={addDonation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addDonation.isPending}>
              {addDonation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Record Donation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
