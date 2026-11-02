import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Eye,
  EyeOff,
  LoaderCircle,
  Truck,
  Wallet,
} from 'lucide-react';
import { loginSchema, registerSchema } from '@crm/shared/schemas';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { ErrorNotice } from '@/components/feedback';
import { errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export function AuthPage({ register = false }: { register?: boolean }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [reveal, setReveal] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = new URLSearchParams(location.search).get('next');
  const next =
    destination?.startsWith('/') &&
    !destination.startsWith('//') &&
    !destination.startsWith('/login') &&
    !destination.startsWith('/register')
      ? destination
      : '/';
  if (user) return <Navigate to={next} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const input = {
      email: data.get('email'),
      password: data.get('password'),
      ...(register ? { name: data.get('name') } : {}),
    };
    const result = (register ? registerSchema : loginSchema).safeParse(input);
    if (!result.success) {
      setError(result.error.issues.map((issue) => issue.message).join('. '));
      return;
    }
    setPending(true);
    try {
      if (register)
        await useAuthStore.getState().register(registerSchema.parse(input));
      else await useAuthStore.getState().login(loginSchema.parse(input));
      navigate(next, { replace: true });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      id="main"
      className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]"
    >
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-panel p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative max-w-md space-y-10">
          <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight">
            Orders, deliveries and accounts on one desk.
          </h2>
          <ul className="space-y-6">
            {[
              [
                ClipboardList,
                'Approve orders',
                'Revisions and approvals stay on the order record.',
              ],
              [
                Truck,
                'Track every shipment',
                'Loading, dispatch, delivery and returns, per batch.',
              ],
              [
                Wallet,
                'Keep accounts straight',
                'Receipts, credits and reward points reconcile automatically.',
              ],
            ].map(([Icon, title, text]) => {
              const Glyph = Icon as typeof Truck;
              return (
                <li key={title as string} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-blue-200">
                    <Glyph className="size-5" />
                  </span>
                  <span>
                    <span className="block font-medium">{title as string}</span>
                    <span className="block text-sm text-slate-300">
                      {text as string}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">FieldDesk CRM</p>
      </aside>
      <div className="relative flex items-center justify-center px-5 py-10">
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {register ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {register
                ? 'Create a Sales account. Your administrator can update your role.'
                : 'Sign in with your work email to open your CRM.'}
            </p>
          </div>
          <form onSubmit={(event) => void submit(event)} className="space-y-5">
            {register && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={pending}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                maxLength={254}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={reveal ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  placeholder={
                    register ? 'At least 12 characters' : 'Enter your password'
                  }
                  required
                  minLength={register ? 12 : 1}
                  maxLength={128}
                  disabled={pending}
                  className="pr-11"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-0.5 size-10 text-muted-foreground"
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                  aria-pressed={reveal}
                  onClick={() => setReveal(!reveal)}
                >
                  {reveal ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {register && (
                <p className="text-xs text-muted-foreground">
                  Use at least 12 characters. A passphrase works well.
                </p>
              )}
            </div>
            {error && <ErrorNotice message={error} />}
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : null}
              {register ? 'Create account' : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {register ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link
              className="font-medium text-primary hover:underline"
              to={register ? '/login' : '/register'}
            >
              {register ? 'Sign in' : 'Create account'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
