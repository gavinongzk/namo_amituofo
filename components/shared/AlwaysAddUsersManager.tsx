'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type Country = 'Singapore' | 'Malaysia';

type AlwaysAddUser = {
  _id: string;
  name: string;
  phoneNumber: string;
  postalCode?: string;
  country: Country;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  phoneNumber: string;
  postalCode: string;
  country: Country;
  enabled: boolean;
};

const defaultFormState: FormState = {
  name: '',
  phoneNumber: '',
  postalCode: '',
  country: 'Singapore',
  enabled: true,
};

const AlwaysAddUsersManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AlwaysAddUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [countryFilter, setCountryFilter] = useState<'All' | Country>('All');

  const queryString = useMemo(() => {
    if (countryFilter === 'All') return '';
    return `?country=${encodeURIComponent(countryFilter)}`;
  }, [countryFilter]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/always-add-users${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch always-add users');
      const result = await response.json();
      setItems(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to load list',
        description: 'Unable to load always-add users right now.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, [queryString]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingId(null);
  };

  const submitForm = async () => {
    const payload = {
      name: formState.name.trim(),
      phoneNumber: formState.phoneNumber.trim(),
      postalCode: formState.postalCode.trim(),
      country: formState.country,
      enabled: formState.enabled,
    };

    if (!payload.name || !payload.phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: 'Name and phone number are required.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingId);
      const url = isEdit
        ? `/api/admin/always-add-users/${editingId}`
        : '/api/admin/always-add-users';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || 'Request failed');
      }

      toast({
        title: isEdit ? 'Entry updated' : 'Entry created',
        description: isEdit
          ? 'Always-add user was updated successfully.'
          : 'Always-add user was created successfully.',
      });

      resetForm();
      await fetchItems();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error?.message || 'Unable to save this entry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: AlwaysAddUser) => {
    setEditingId(item._id);
    setFormState({
      name: item.name,
      phoneNumber: item.phoneNumber,
      postalCode: item.postalCode || '',
      country: item.country,
      enabled: item.enabled,
    });
  };

  const deleteItem = async (id: string) => {
    const confirmed = window.confirm('Delete this always-add user?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/always-add-users/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || 'Delete failed');
      }

      toast({ title: 'Entry deleted', description: 'Always-add user removed.' });
      if (editingId === id) resetForm();
      await fetchItems();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error?.message || 'Unable to delete this entry.',
      });
    }
  };

  const toggleEnabled = async (item: AlwaysAddUser) => {
    try {
      const response = await fetch(`/api/admin/always-add-users/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      await fetchItems();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Unable to update enabled state.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Always Add Users</h2>
        <p className="mb-4 text-sm text-gray-600">
          These users are auto-registered whenever a new event is published in their country.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            placeholder="Name"
            value={formState.name}
            onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Phone Number (e.g. +6588888888)"
            value={formState.phoneNumber}
            onChange={(e) => setFormState((prev) => ({ ...prev, phoneNumber: e.target.value }))}
          />
          <Input
            placeholder="Postal Code (optional)"
            value={formState.postalCode}
            onChange={(e) => setFormState((prev) => ({ ...prev, postalCode: e.target.value }))}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={formState.country}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, country: e.target.value as Country }))
            }
          >
            <option value="Singapore">Singapore</option>
            <option value="Malaysia">Malaysia</option>
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Checkbox
            checked={formState.enabled}
            onCheckedChange={(checked) =>
              setFormState((prev) => ({ ...prev, enabled: checked === true }))
            }
          />
          <span className="text-sm text-gray-700">Enabled</span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={submitForm} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Current List</h3>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value as 'All' | Country)}
          >
            <option value="All">All countries</option>
            <option value="Singapore">Singapore</option>
            <option value="Malaysia">Malaysia</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading list...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">No always-add users configured yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-600">
                    {item.phoneNumber} {item.postalCode ? ` | ${item.postalCode}` : ''}
                  </p>
                  <p className="text-gray-500">
                    {item.country} | {item.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toggleEnabled(item)}>
                    {item.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outline" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => deleteItem(item._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AlwaysAddUsersManager;
