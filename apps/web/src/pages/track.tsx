import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TrackPage() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedOrder = orderNumber.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedOrder || !trimmedPhone) {
      return;
    }

    navigate(
      `/order/${encodeURIComponent(trimmedOrder)}?phone=${encodeURIComponent(trimmedPhone)}`,
    );
  };

  return (
    <SiteLayout>
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card p-6 sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-5 text-center text-2xl font-semibold">Track your order</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your order number and the mobile number you used at checkout.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="orderNumber">Order number</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="YQ-XXXXXX-XXXX"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              View order status
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Your order number is on the confirmation screen and in the message we send you.
          </p>

          <div className="mt-6 border-t border-border/70 pt-5 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/shop">Back to shop</Link>
            </Button>
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}
