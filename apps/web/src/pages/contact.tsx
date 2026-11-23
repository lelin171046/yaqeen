import {
  SUPPORT_TOPICS,
  SUPPORT_TOPIC_LABELS,
  supportMessageInputSchema,
  type SupportTopic,
} from '@anando-deal/shared';
import { Mail, MessageCircle, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Field } from '@/components/admin/ui';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSendSupportMessage } from '@/hooks/use-support';
import { useSettings } from '@/hooks/use-settings';
import { getApiErrorMessage } from '@/lib/api-error';
import { getWhatsAppHref } from '@/lib/whatsapp';

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  topic: SupportTopic;
  orderNumber: string;
  message: string;
}

const emptyForm: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  topic: 'OTHER',
  orderNumber: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const { data: settings } = useSettings();
  const sendMessage = useSendSupportMessage();

  const setField = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = supportMessageInputSchema.safeParse(form);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');

        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }

      setErrors(nextErrors);
      toast.error('Please check the highlighted fields.');
      return;
    }

    setErrors({});
    sendMessage.mutate(parsed.data, {
      onSuccess: ({ message, delivered }) => {
        setSubmittedTicket(message.ticket);
        setForm(emptyForm);
        toast.success(
          delivered
            ? `Message sent. Your reference is ${message.ticket}.`
            : `Message saved as ${message.ticket}. Email delivery is unavailable right now.`,
        );
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Mail className="h-3.5 w-3.5" />
              Support
            </span>
            <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Contact us</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Have a question about an order, a product, or a return? Send us a message and our team
              will get back to you by email.
            </p>

            <div className="mt-8 space-y-4 rounded-2xl border bg-card p-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="mt-1 break-all font-medium">
                  {settings?.supportEmail || 'Support email is not configured yet'}
                </p>
              </div>
              {settings?.supportPhone && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 font-medium">{settings.supportPhone}</p>
                </div>
              )}
              <div className="border-t border-border/70 pt-4">
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={getWhatsAppHref('Hi Anando Deal, I need help with an order.')}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle />
                    Chat on WhatsApp instead
                  </a>
                </Button>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Looking for an order status?{' '}
              <Link to="/track" className="font-semibold text-primary hover:underline">
                Track your order
              </Link>
              .
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            {submittedTicket ? (
              <div className="grid min-h-[420px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold">Message received</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep this reference for your records.
                  </p>
                  <p className="mt-4 text-lg font-semibold">{submittedTicket}</p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setSubmittedTicket(null)}
                  >
                    Send another message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="name" error={errors.name}>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(event) => setField('name', event.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email address" htmlFor="email" error={errors.email}>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Mobile number"
                    htmlFor="phone"
                    hint="Optional, but useful for a quick reply."
                    error={errors.phone}
                  >
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      placeholder="01XXXXXXXXX"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="What is this about?" htmlFor="topic" error={errors.topic}>
                    <Select
                      id="topic"
                      value={form.topic}
                      onChange={(event) => setField('topic', event.target.value as SupportTopic)}
                    >
                      {SUPPORT_TOPICS.map((topic) => (
                        <option key={topic} value={topic}>
                          {SUPPORT_TOPIC_LABELS[topic]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Order number"
                  htmlFor="orderNumber"
                  hint="Optional, if your question is about an order."
                  error={errors.orderNumber}
                >
                  <Input
                    id="orderNumber"
                    value={form.orderNumber}
                    onChange={(event) => setField('orderNumber', event.target.value)}
                    placeholder="AD-XXXXXX-XXXX"
                  />
                </Field>

                <Field label="Message" htmlFor="message" error={errors.message}>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(event) => setField('message', event.target.value)}
                    placeholder="Tell us how we can help…"
                    className="min-h-36"
                    maxLength={2000}
                  />
                </Field>

                <Button type="submit" size="lg" className="w-full" disabled={sendMessage.isPending}>
                  {sendMessage.isPending ? 'Sending…' : 'Send message'}
                  {!sendMessage.isPending && <Send className="h-4 w-4" />}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  We use your email only to reply to this support request.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}
