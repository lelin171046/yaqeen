import { settingsUpdateSchema } from '@yaqeen/shared';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-admin-settings';
import { getApiErrorMessage } from '@/lib/api-error';
import type { AdminSettingsDto } from '@/lib/types';

interface ZoneRow {
  name: string;
  charge: string;
  isActive: boolean;
}

interface SettingsFormState {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  freeDeliveryThreshold: string;
  defaultDeliveryCharge: string;
  deliveryZones: ZoneRow[];
  adminAlertEmails: string;
  adminAlertWhatsapp: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
}

function toFormState(settings: AdminSettingsDto): SettingsFormState {
  return {
    storeName: settings.storeName,
    supportPhone: settings.supportPhone,
    supportEmail: settings.supportEmail,
    bkashMerchantNumber: settings.bkashMerchantNumber,
    freeDeliveryThreshold: String(settings.freeDeliveryThreshold),
    defaultDeliveryCharge: String(settings.defaultDeliveryCharge),
    deliveryZones: settings.deliveryZones.map((zone) => ({
      name: zone.name,
      charge: String(zone.charge),
      isActive: zone.isActive,
    })),
    adminAlertEmails: settings.adminAlertEmails.join(', '),
    adminAlertWhatsapp: settings.adminAlertWhatsapp.join(', '),
    facebook: settings.socialLinks.facebook,
    instagram: settings.socialLinks.instagram,
    whatsapp: settings.socialLinks.whatsapp,
  };
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading, isError, error } = useAdminSettings();

  if (isLoading) {
    return <LoadingBlock label="Loading settings…" />;
  }

  if (isError || !settings) {
    return <ErrorBlock message={getApiErrorMessage(error)} />;
  }

  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: AdminSettingsDto }) {
  const updateSettings = useUpdateAdminSettings();
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const updateZone = (index: number, patch: Partial<ZoneRow>) => {
    setForm((current) => ({
      ...current,
      deliveryZones: current.deliveryZones.map((zone, position) =>
        position === index ? { ...zone, ...patch } : zone,
      ),
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormError('');

    const parsed = settingsUpdateSchema.safeParse({
      storeName: form.storeName,
      supportPhone: form.supportPhone,
      supportEmail: form.supportEmail,
      bkashMerchantNumber: form.bkashMerchantNumber,
      freeDeliveryThreshold: form.freeDeliveryThreshold === '' ? 0 : form.freeDeliveryThreshold,
      defaultDeliveryCharge:
        form.defaultDeliveryCharge === '' ? 0 : form.defaultDeliveryCharge,
      deliveryZones: form.deliveryZones.map((zone) => ({
        name: zone.name,
        charge: zone.charge === '' ? 0 : zone.charge,
        isActive: zone.isActive,
      })),
      adminAlertEmails: form.adminAlertEmails
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
      adminAlertWhatsapp: form.adminAlertWhatsapp
        .split(',')
        .map((phone) => phone.trim())
        .filter(Boolean),
      socialLinks: {
        facebook: form.facebook,
        instagram: form.instagram,
        whatsapp: form.whatsapp,
      },
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.map(String).join('.')] = issue.message;
      }

      setErrors(nextErrors);
      setFormError('Please fix the highlighted settings before saving.');
      return;
    }

    updateSettings.mutate(parsed.data, {
      onSuccess: () => toast.success('Store settings saved'),
      onError: (mutationError) => {
        const message = getApiErrorMessage(mutationError);
        setFormError(message);
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PageHeader
        title="Settings"
        description="Store details, delivery charges and alert recipients."
      >
        <Button type="submit" size="sm" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </PageHeader>

      {formError && <ErrorBlock message={formError} />}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Store details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Store name" htmlFor="storeName" error={errors.storeName} className="sm:col-span-2">
              <Input
                id="storeName"
                value={form.storeName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, storeName: event.target.value }))
                }
              />
            </Field>
            <Field label="Support phone" htmlFor="supportPhone" error={errors.supportPhone}>
              <Input
                id="supportPhone"
                value={form.supportPhone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supportPhone: event.target.value }))
                }
                placeholder="+8801799573916"
              />
            </Field>
            <Field label="Support email" htmlFor="supportEmail" error={errors.supportEmail}>
              <Input
                id="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supportEmail: event.target.value }))
                }
                placeholder="hello@yaqeen.com"
              />
            </Field>
            <Field
              label="bKash merchant number"
              htmlFor="bkashMerchantNumber"
              error={errors.bkashMerchantNumber}
              className="sm:col-span-2"
            >
              <Input
                id="bkashMerchantNumber"
                value={form.bkashMerchantNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bkashMerchantNumber: event.target.value,
                  }))
                }
                placeholder="01XXXXXXXXX"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Delivery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Free delivery threshold (৳)"
              htmlFor="freeDeliveryThreshold"
              hint="Set 0 to disable free delivery"
              error={errors.freeDeliveryThreshold}
            >
              <Input
                id="freeDeliveryThreshold"
                type="number"
                min="0"
                value={form.freeDeliveryThreshold}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    freeDeliveryThreshold: event.target.value,
                  }))
                }
              />
            </Field>
            <Field
              label="Default delivery charge (৳)"
              htmlFor="defaultDeliveryCharge"
              error={errors.defaultDeliveryCharge}
            >
              <Input
                id="defaultDeliveryCharge"
                type="number"
                min="0"
                value={form.defaultDeliveryCharge}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultDeliveryCharge: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Delivery zones</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    deliveryZones: [
                      ...current.deliveryZones,
                      { name: '', charge: '0', isActive: true },
                    ],
                  }))
                }
              >
                <Plus />
                Add zone
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {form.deliveryZones.map((zone, index) => (
                <div key={index} className="rounded-xl border bg-background p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto_auto] sm:items-end">
                    <Field label="Zone name" htmlFor={`zone-name-${index}`} error={errors[`deliveryZones.${index}.name`]}>
                      <Input
                        id={`zone-name-${index}`}
                        value={zone.name}
                        onChange={(event) =>
                          updateZone(index, { name: event.target.value })
                        }
                        placeholder="Inside Dhaka"
                        className="h-10"
                      />
                    </Field>
                    <Field label="Charge (৳)" htmlFor={`zone-charge-${index}`} error={errors[`deliveryZones.${index}.charge`]}>
                      <Input
                        id={`zone-charge-${index}`}
                        type="number"
                        min="0"
                        value={zone.charge}
                        onChange={(event) =>
                          updateZone(index, { charge: event.target.value })
                        }
                        className="h-10"
                      />
                    </Field>
                    <label className="flex h-10 items-center gap-2 rounded-lg border bg-card px-2 text-xs">
                      <input
                        type="checkbox"
                        checked={zone.isActive}
                        onChange={(event) =>
                          updateZone(index, { isActive: event.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      Active
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          deliveryZones: current.deliveryZones.filter(
                            (_, position) => position !== index,
                          ),
                        }))
                      }
                      aria-label={`Remove zone ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {form.deliveryZones.length === 0 && (
                <p className="rounded-xl border border-dashed bg-background px-3 py-6 text-center text-xs text-muted-foreground">
                  No zones yet. The default delivery charge will be used.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Comma-separated recipients for new order alerts.
          </p>
          <div className="mt-4 space-y-4">
            <Field label="Alert emails" htmlFor="adminAlertEmails" error={errors['adminAlertEmails.0']}>
              <Input
                id="adminAlertEmails"
                value={form.adminAlertEmails}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adminAlertEmails: event.target.value,
                  }))
                }
                placeholder="owner@yaqeen.com, ops@yaqeen.com"
              />
            </Field>
            <Field
              label="Alert WhatsApp numbers"
              htmlFor="adminAlertWhatsapp"
              error={errors['adminAlertWhatsapp.0']}
            >
              <Input
                id="adminAlertWhatsapp"
                value={form.adminAlertWhatsapp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adminAlertWhatsapp: event.target.value,
                  }))
                }
                placeholder="+8801799573916"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Social links</h2>
          <div className="mt-4 space-y-4">
            <Field label="Facebook" htmlFor="facebook" error={errors['socialLinks.facebook']}>
              <Input
                id="facebook"
                value={form.facebook}
                onChange={(event) =>
                  setForm((current) => ({ ...current, facebook: event.target.value }))
                }
                placeholder="https://facebook.com/yaqeen"
              />
            </Field>
            <Field label="Instagram" htmlFor="instagram" error={errors['socialLinks.instagram']}>
              <Input
                id="instagram"
                value={form.instagram}
                onChange={(event) =>
                  setForm((current) => ({ ...current, instagram: event.target.value }))
                }
                placeholder="https://instagram.com/yaqeen"
              />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" error={errors['socialLinks.whatsapp']}>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(event) =>
                  setForm((current) => ({ ...current, whatsapp: event.target.value }))
                }
                placeholder="https://wa.me/8801799573916"
              />
            </Field>
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
