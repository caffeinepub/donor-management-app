import { useEffect } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  useGetDonor,
  useCreateDonor,
  useEditDonor,
  useGetGroceryItems,
  useIsCallerAdmin,
} from '../hooks/useQueries';
import { useSubAccountAuth } from '../hooks/useSubAccountAuth';
import type { GroceryItem } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, DollarSign, ShoppingBasket, MapPin } from 'lucide-react';

interface FormValues {
  name: string;
  address: string;
  addressNumber: string;
  place: string;
  donationType: 'money' | 'groceries';
  moneyAmount: string;
  selectedGroceries: Record<string, string>;
  notes: string;
  mapLink: string;
}

export default function DonorFormPage() {
  const params = useParams({ strict: false }) as { logNumber?: string };
  const navigate = useNavigate();
  const isEditing = !!params.logNumber;
  const donorId = params.logNumber ? parseInt(params.logNumber, 10) : undefined;

  const { data: isAdmin } = useIsCallerAdmin();
  const { isSubAdmin } = useSubAccountAuth();
  const canManage = isAdmin || isSubAdmin;

  const { data: donor } = useGetDonor(donorId!);
  const { data: groceryItems = [] } = useGetGroceryItems();
  const createDonor = useCreateDonor();
  const editDonor = useEditDonor();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      address: '',
      addressNumber: '',
      place: '',
      donationType: 'money',
      moneyAmount: '',
      selectedGroceries: {},
      notes: '',
      mapLink: '',
    },
  });

  const donationType = watch('donationType');

  // Populate form when editing
  useEffect(() => {
    if (donor && isEditing) {
      const dt = donor.initialDonationType;
      const isGroceries = dt.__kind__ === 'groceries';
      const groceriesMap: Record<string, string> = {};
      if (isGroceries) {
        dt.groceries.forEach((g) => {
          groceriesMap[g.name] = g.quantity || '';
        });
      }
      reset({
        name: donor.name,
        address: donor.address,
        addressNumber: donor.addressNumber,
        place: donor.place,
        donationType: isGroceries ? 'groceries' : 'money',
        moneyAmount: dt.__kind__ === 'money' ? String(dt.money) : '',
        selectedGroceries: groceriesMap,
        notes: donor.notes,
        mapLink: donor.mapLink || '',
      });
    }
  }, [donor, isEditing, reset]);

  const onSubmit = async (data: FormValues) => {
    let donationTypePayload: { __kind__: 'money'; money: number } | { __kind__: 'groceries'; groceries: GroceryItem[] };

    if (data.donationType === 'money') {
      const amount = parseInt(data.moneyAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid money amount');
        return;
      }
      donationTypePayload = { __kind__: 'money', money: amount };
    } else {
      const groceries: GroceryItem[] = Object.entries(data.selectedGroceries).map(([name, qty]) => ({
        name,
        quantity: qty || undefined,
      }));
      if (groceries.length === 0) {
        toast.error('Please select at least one grocery item');
        return;
      }
      donationTypePayload = { __kind__: 'groceries', groceries };
    }

    const mapLink = data.mapLink.trim() || null;

    try {
      if (isEditing && donorId !== undefined) {
        await editDonor.mutateAsync({
          logNumber: donorId,
          name: data.name,
          address: data.address,
          addressNumber: data.addressNumber,
          place: data.place,
          donationType: donationTypePayload,
          notes: data.notes,
          mapLink,
        });
        toast.success('Donor updated successfully');
        navigate({ to: '/donor/$logNumber', params: { logNumber: String(donorId) } });
      } else {
        const newId = await createDonor.mutateAsync({
          name: data.name,
          address: data.address,
          addressNumber: data.addressNumber,
          place: data.place,
          donationType: donationTypePayload,
          notes: data.notes,
          mapLink,
        });
        toast.success('Donor added successfully');
        navigate({ to: '/donor/$logNumber', params: { logNumber: String(newId) } });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save donor');
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">Only admins can add or edit donors.</p>
        <Button asChild variant="outline">
          <Link to="/">Back to Donors</Link>
        </Button>
      </div>
    );
  }

  const isPending = createDonor.isPending || editDonor.isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-heading">
          {isEditing ? 'Edit Donor' : 'Add New Donor'}
        </h1>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground font-normal">
            {isEditing ? 'Update donor information below' : 'Fill in the donor details below'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="Donor's full name"
                disabled={isPending}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Address */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  {...register('address', { required: 'Address is required' })}
                  placeholder="Street name"
                  disabled={isPending}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addressNumber">No.</Label>
                <Input
                  id="addressNumber"
                  {...register('addressNumber')}
                  placeholder="123"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Place */}
            <div className="space-y-1.5">
              <Label htmlFor="place">Place / Area *</Label>
              <Input
                id="place"
                {...register('place', { required: 'Place is required' })}
                placeholder="e.g. Downtown, North District"
                disabled={isPending}
              />
              {errors.place && <p className="text-xs text-destructive">{errors.place.message}</p>}
            </div>

            {/* Google Maps Link */}
            <div className="space-y-1.5">
              <Label htmlFor="mapLink" className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Google Maps Link (optional)
              </Label>
              <Input
                id="mapLink"
                {...register('mapLink')}
                placeholder="https://maps.app.goo.gl/..."
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Paste a Google Maps share link to enable map preview for this donor.
              </p>
            </div>

            {/* Donation Type */}
            <div className="space-y-2">
              <Label>Initial Donation Type *</Label>
              <Controller
                name="donationType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="money" id="form-money" />
                      <Label htmlFor="form-money" className="flex items-center gap-1 cursor-pointer">
                        <DollarSign className="w-4 h-4 text-green-600" /> Money
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="groceries" id="form-groceries" />
                      <Label htmlFor="form-groceries" className="flex items-center gap-1 cursor-pointer">
                        <ShoppingBasket className="w-4 h-4 text-amber-600" /> Groceries
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Money amount */}
            {donationType === 'money' && (
              <div className="space-y-1.5">
                <Label htmlFor="moneyAmount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="moneyAmount"
                    type="number"
                    min="1"
                    {...register('moneyAmount')}
                    placeholder="0"
                    className="pl-7"
                    disabled={isPending}
                  />
                </div>
              </div>
            )}

            {/* Grocery items */}
            {donationType === 'groceries' && (
              <div className="space-y-2">
                <Label>Select Grocery Items *</Label>
                {groceryItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No grocery items available. Add them in the Admin Panel first.
                  </p>
                ) : (
                  <Controller
                    name="selectedGroceries"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                        {groceryItems.map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <Checkbox
                              id={`form-grocery-${item}`}
                              checked={field.value[item] !== undefined}
                              onCheckedChange={(checked) => {
                                const next = { ...field.value };
                                if (checked) {
                                  next[item] = '';
                                } else {
                                  delete next[item];
                                }
                                field.onChange(next);
                              }}
                              disabled={isPending}
                            />
                            <Label htmlFor={`form-grocery-${item}`} className="flex-1 cursor-pointer text-sm">
                              {item}
                            </Label>
                            {field.value[item] !== undefined && (
                              <Input
                                type="text"
                                placeholder="Qty"
                                value={field.value[item]}
                                onChange={(e) => {
                                  field.onChange({ ...field.value, [item]: e.target.value });
                                }}
                                className="w-20 h-7 text-xs"
                                disabled={isPending}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional notes about this donor..."
                rows={3}
                disabled={isPending}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Update Donor' : 'Add Donor'}
                  </span>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
