'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import { getCustomersByMobilePrefix } from '~/lib/orders/customers.server';
import { createOrder } from '~/lib/orders/orders-actions.server';
import { formatIndianMobile, getLocalDigitsForSearch, normalizeIndianMobile } from '~/lib/phone';
import pathsConfig from '~/config/paths.config';

type CustomerSuggestion = {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
};

type CreateOrderFormProps = {
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
  compact?: boolean;
};

export function CreateOrderForm({ onSuccess, onCancel, compact }: CreateOrderFormProps) {
  const router = useRouter();
  const [mobile, setMobile] = useState('+91');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [orderDescription, setOrderDescription] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedDisplayId, setGeneratedDisplayId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const mobileWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedFromSuggestion, setSelectedFromSuggestion] = useState(false);

  const fetchSuggestions = useCallback(async (value: string) => {
    const localDigits = getLocalDigitsForSearch(value);
    if (localDigits.length < 1) {
      setSuggestions([]);
      return;
    }
    const list = await getCustomersByMobilePrefix(localDigits, 10);
    setSuggestions(list);
  }, []);

  useEffect(() => {
    if (selectedFromSuggestion) {
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(mobile);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mobile, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileWrapperRef.current && !mobileWrapperRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectCustomer(c: CustomerSuggestion) {
    setSelectedFromSuggestion(true);
    setMobile(formatIndianMobile(c.mobile) || normalizeIndianMobile(c.mobile));
    setName(c.name);
    setAddress(c.address ?? '');
    setCustomerId(c.id);
    setSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedMobile = normalizeIndianMobile(mobile);
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedDesc = orderDescription.trim();

    if (!trimmedMobile) {
      toast.error('Mobile number is required');
      return;
    }
    const digitsOnly = trimmedMobile.replace(/\D/g, '');
    const localDigits = digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;
    if (localDigits.length !== 10) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!trimmedName) {
      toast.error('Customer name is required');
      return;
    }
    if (!trimmedAddress) {
      toast.error('Customer address is required');
      return;
    }
    if (!trimmedDesc) {
      toast.error('Order description is required');
      return;
    }

    setLoading(true);
    const { id, display_id, error } = await createOrder({
      customer_id: customerId,
      customer_name: trimmedName,
      customer_mobile: trimmedMobile,
      customer_address: trimmedAddress,
      order_description: trimmedDesc,
    });
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }
    setGeneratedDisplayId(display_id ?? (id ? id.slice(0, 8) : null));
    toast.success('Order created!');
    if (!onSuccess) {
      if (id) router.push(`${pathsConfig.app.orders}/${id}`);
      else router.push(pathsConfig.app.orders);
    }
  }

  function handleClose() {
    if (onSuccess && generatedDisplayId) {
      onSuccess('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="space-y-2">
        <Label htmlFor="order-id">Order ID</Label>
        <Input
          id="order-id"
          type="text"
          disabled
          value={generatedDisplayId ? `#${generatedDisplayId}` : ''}
          placeholder={generatedDisplayId ? undefined : 'Auto-generated on save'}
          className="bg-muted"
        />
      </div>

      <div className="relative space-y-2" ref={mobileWrapperRef}>
        <Label htmlFor="mobile">Mobile No. *</Label>
        <Input
          id="mobile"
          type="tel"
          placeholder="+91 98765 43210"
          value={mobile}
          onChange={(e) => {
            setSelectedFromSuggestion(false);
            const raw = e.target.value;
            let digits = raw.replace(/\D/g, '');

            // Treat leading 91 as country code; keep only the 10-digit Indian number
            if (digits.startsWith('91')) {
              digits = digits.slice(2);
            }
            const local = digits.slice(0, 10);

            if (!local) {
              setMobile('+91');
              return;
            }

            const first = local.slice(0, 5);
            const second = local.slice(5, 10);
            const spaced = second ? `${first} ${second}` : first;

            setMobile(`+91 ${spaced}`);
          }}
          required
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="border-input bg-background absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-lg">
            {suggestions.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="hover:bg-muted flex w-full flex-col items-start px-3 py-2 text-left text-sm"
                  onClick={() => selectCustomer(c)}
                >
                  <span className="font-medium">{c.mobile}</span>
                  <span className="text-muted-foreground">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Customer Name *</Label>
        <Input
          id="name"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Customer Address *</Label>
        <Input
          id="address"
          placeholder="Full address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          autoComplete="street-address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order-description">Order Description *</Label>
        <Textarea
          id="order-description"
          placeholder="Describe the order"
          value={orderDescription}
          onChange={(e) => setOrderDescription(e.target.value)}
          rows={compact ? 2 : 3}
          required
        />
      </div>

      <div className={compact ? 'flex justify-end gap-2 pt-2' : 'flex gap-2 pt-2'}>
        {generatedDisplayId ? (
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating…' : 'Create Order'}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
