import { useState } from 'react';
import { useGetGroceryItems, useAddGroceryItem, useDeleteGroceryItem } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageGroceryList() {
  const { data: items = [], isLoading } = useGetGroceryItems();
  const addMutation = useAddGroceryItem();
  const deleteMutation = useDeleteGroceryItem();
  const [newItem, setNewItem] = useState('');

  const handleAdd = async () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.error('Item already exists');
      return;
    }
    try {
      await addMutation.mutateAsync(trimmed);
      setNewItem('');
      toast.success(`"${trimmed}" added to grocery list`);
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleDelete = async (item: string) => {
    try {
      await deleteMutation.mutateAsync(item);
      toast.success(`"${item}" removed from grocery list`);
    } catch {
      toast.error('Failed to remove item');
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShoppingBasket size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Grocery Items</h3>
          <p className="text-xs text-muted-foreground">Manage the grocery selection list for donations</p>
        </div>
      </div>

      {/* Current Items */}
      {isLoading ? (
        <div className="space-y-2 mb-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm italic mb-4">No grocery items yet. Add some below.</p>
      ) : (
        <div className="space-y-2 mb-5">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between px-4 py-2.5 bg-muted/40 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{item}</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(item)}
                disabled={deleteMutation.isPending}
                aria-label={`Delete ${item}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Item */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="New grocery item (e.g. Oil, Flour)"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={addMutation.isPending || !newItem.trim()}
          className="gap-2 flex-shrink-0"
        >
          {addMutation.isPending ? (
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Plus size={16} />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}
