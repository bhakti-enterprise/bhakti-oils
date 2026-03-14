'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@kit/ui/button';

import { CreateOrderModal } from '~/home/orders/_components/create-order-modal';

export function NewOrderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Order
      </Button>
      <CreateOrderModal open={open} onOpenChange={setOpen} />
    </>
  );
}
