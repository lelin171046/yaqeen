import {
  SUPPORT_MESSAGE_STATUSES,
  SUPPORT_MESSAGE_STATUS_LABELS,
  SUPPORT_TOPIC_LABELS,
  type SupportMessageStatus,
} from '@anando-deal/shared';
import { Mail, Search, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  EmptyState,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  Pagination,
  StatusBadge,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminSupportMessage,
  useAdminSupportMessages,
  useReplySupportMessage,
  useUpdateSupportMessageStatus,
} from '@/hooks/use-support';
import { getApiErrorMessage } from '@/lib/api-error';
import type { SupportMessageDto } from '@/lib/types';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function topicLabel(topic: SupportMessageDto['topic']): string {
  return SUPPORT_TOPIC_LABELS[topic] ?? topic;
}

export default function AdminSupportPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading, isError, error } = useAdminSupportMessages({
    search: search || undefined,
    status: status ? (status as SupportMessageStatus) : undefined,
    page,
    limit: 15,
  });
  const { data: selected, isLoading: detailLoading } = useAdminSupportMessage(
    selectedId ?? undefined,
  );
  const updateStatus = useUpdateSupportMessageStatus(selectedId ?? '');
  const reply = useReplySupportMessage(selectedId ?? '');

  const resetPage = () => setPage(1);

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedId || !replyText.trim()) {
      return;
    }

    reply.mutate(
      { message: replyText },
      {
        onSuccess: () => {
          setReplyText('');
          toast.success('Reply sent by email.');
        },
        onError: (replyError) => toast.error(getApiErrorMessage(replyError)),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support"
        description="Read customer support messages, reply by email and track their status."
      />

      <div className="rounded-2xl border bg-card p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setSelectedId(null);
            resetPage();
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search reference, name, email or message"
              className="pl-9"
              aria-label="Search support messages"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Search
            </Button>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setSelectedId(null);
                resetPage();
              }}
              aria-label="Filter by support status"
              className="h-10 text-xs sm:w-44"
            >
              <option value="">All statuses</option>
              {SUPPORT_MESSAGE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {SUPPORT_MESSAGE_STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
        </form>
      </div>

      {isLoading && <LoadingBlock label="Loading support messages…" />}
      {isError && <ErrorBlock message={getApiErrorMessage(error)} />}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState
          title="No support messages yet"
          description="Customer messages from the contact page will appear here."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold">Topic</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.items.map((message) => (
                      <tr
                        key={message.id}
                        onClick={() => setSelectedId(message.id)}
                        className={`cursor-pointer hover:bg-muted/30 ${
                          selectedId === message.id ? 'bg-muted/50' : ''
                        }`}
                      >
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedId(message.id)}
                            className="font-semibold text-primary hover:underline"
                          >
                            {message.ticket}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {message.deliveryStatus === 'SENT'
                              ? 'Email delivered'
                              : `Email ${message.deliveryStatus.toLowerCase()}`}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{message.name}</p>
                          <p className="text-xs text-muted-foreground">{message.email}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {topicLabel(message.topic)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge value={message.status} />
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                          {formatDateTime(message.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              page={data.pagination.page}
              pages={data.pagination.pages}
              total={data.pagination.total}
              onPage={setPage}
            />
          </div>

          <div className="rounded-2xl border bg-card p-5">
            {!selectedId && (
              <div className="grid min-h-[320px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold">Select a message</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a support request to read and reply.
                  </p>
                </div>
              </div>
            )}

            {selectedId && detailLoading && <LoadingBlock label="Loading message…" />}

            {selectedId && !detailLoading && !selected && (
              <ErrorBlock message="This support message could not be loaded." />
            )}

            {selected && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.ticket}</h2>
                    <p className="text-xs text-muted-foreground">
                      Received {formatDateTime(selected.createdAt)}
                    </p>
                  </div>
                  <StatusBadge value={selected.status} />
                </div>

                <Field label="Status" htmlFor="support-status">
                  <Select
                    id="support-status"
                    value={selected.status}
                    disabled={updateStatus.isPending}
                    onChange={(event) => {
                      updateStatus.mutate(
                        { status: event.target.value as SupportMessageStatus },
                        {
                          onSuccess: () => toast.success('Status updated.'),
                          onError: (statusError) => toast.error(getApiErrorMessage(statusError)),
                        },
                      );
                    }}
                  >
                    {SUPPORT_MESSAGE_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {SUPPORT_MESSAGE_STATUS_LABELS[item]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="mt-0.5 font-medium">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Topic</p>
                    <p className="mt-0.5 font-medium">{topicLabel(selected.topic)}</p>
                  </div>
                  <div className="col-span-2 break-all">
                    <p className="text-muted-foreground">Email</p>
                    <p className="mt-0.5 font-medium">{selected.email}</p>
                  </div>
                  {selected.phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="mt-0.5 font-medium">{selected.phone}</p>
                    </div>
                  )}
                  {selected.orderNumber && (
                    <div>
                      <p className="text-muted-foreground">Order</p>
                      <p className="mt-0.5 font-medium">{selected.orderNumber}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Message
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{selected.message}</p>
                </div>

                <div className="rounded-xl border p-4 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Support email</span>
                    <StatusBadge value={selected.deliveryStatus} />
                  </div>
                  {selected.deliveryError && (
                    <p className="mt-2 text-muted-foreground">{selected.deliveryError}</p>
                  )}
                  <p className="mt-2 text-muted-foreground">
                    Customer acknowledgement: {selected.acknowledgementStatus.toLowerCase()}
                  </p>
                </div>

                {selected.replies.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Replies
                    </p>
                    {selected.replies.map((item) => (
                      <div key={item.id} className="rounded-xl bg-secondary/50 p-4 text-sm">
                        <p className="whitespace-pre-wrap">{item.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Sent {formatDateTime(item.sentAt)} via {item.provider || 'email'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleReply} className="space-y-3 border-t border-border/70 pt-4">
                  <Field label="Reply by email" htmlFor="support-reply">
                    <Textarea
                      id="support-reply"
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Write your reply to the customer…"
                      maxLength={2000}
                      disabled={reply.isPending}
                    />
                  </Field>
                  <Button type="submit" disabled={reply.isPending || !replyText.trim()}>
                    {reply.isPending ? 'Sending…' : 'Send reply'}
                    {!reply.isPending && <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
