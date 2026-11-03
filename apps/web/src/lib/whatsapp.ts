export function getWhatsAppHref(message?: string): string {
  const number = import.meta.env.VITE_STORE_WHATSAPP;

  if (!number) {
    return '#contact';
  }

  const digits = number.replace(/\D/g, '');
  const query = message ? `?text=${encodeURIComponent(message)}` : '';

  return `https://wa.me/${digits}${query}`;
}
