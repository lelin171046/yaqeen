import { BRAND_LOGO_URL, loginSchema } from '@yaqeen/shared';
import { ArrowRight, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminLogin, useAdminSession } from '@/hooks/use-admin-auth';
import { getApiErrorMessage } from '@/lib/api-error';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: admin, isLoading } = useAdminSession();
  const login = useAdminLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (!isLoading && admin) {
    return <Navigate to={from} replace />;
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path[0];

        if (key === 'email' || key === 'password') {
          nextErrors[key] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    login.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Welcome back');
        navigate(from, { replace: true });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img
            src={BRAND_LOGO_URL}
            alt="Yaqeen"
            className="h-12 w-12 rounded-full bg-white/10"
          />
          <div>
            <p className="font-display text-2xl font-semibold">Yaqeen</p>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
              Healthy Foods
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Run the store without the busywork.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
            Track orders, manage your catalogue, verify bKash payments and keep an eye on
            what is selling — all from one calm dashboard.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/80">
            {[
              'Live order and revenue overview',
              'Product, category and stock management',
              'Manual bKash payment verification',
              'Cloudinary image and video uploads',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-foreground/15 text-xs">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Yaqeen Healthy Foods. Admin access only.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={BRAND_LOGO_URL} alt="Yaqeen" className="h-11 w-11 rounded-full" />
            <div>
              <p className="font-display text-xl font-semibold">Yaqeen</p>
              <p className="text-xs text-muted-foreground">Admin dashboard</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your Yaqeen admin account to continue.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@yaqeen.local"
                  className="pl-10"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">First time here?</p>
              <p className="mt-1">
                Run <code className="rounded bg-muted px-1 py-0.5">npm run seed -w @yaqeen/api</code>{' '}
                then sign in with the email and password from{' '}
                <code className="rounded bg-muted px-1 py-0.5">apps/api/.env</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
