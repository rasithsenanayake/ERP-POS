import React, { FormEvent, useState } from 'react';
import { apiRequest, apiMessage } from '../../utils/backend/api';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { cn } from '../../utils/cn';
import { inputClass } from '../../utils/styles';

type AuthMode = 'login' | 'register';

export function SignIn() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter your email address.');
    if (password.length < 8) return setError('Use a password with at least 8 characters.');
    if (mode === 'register' && displayName.trim().length < 2) return setError('Enter your name.');

    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get('invite');
      const body = mode === 'login' ? { email, password } : { email, password, displayName, ...(inviteToken ? { inviteToken } : {}) };
      await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
      window.location.replace('/dashboard');
    } catch (cause) {
      setError(apiMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-canvas">
      <section className="hidden w-[44%] max-w-[560px] flex-col justify-between border-r border-line bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">B</span>
          <span className="text-sm font-semibold text-ink">Business OS</span>
        </div>
        <div>
          <p className="max-w-sm text-2xl font-semibold leading-snug tracking-[-0.01em] text-ink">Sales, stock, money and people — one workspace your whole team shares.</p>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">Your workspace is stored on its PostgreSQL server and shared with your team.</p>
        </div>
        <p className="text-xs text-subtle">Private workspace · Owner-managed access</p>
      </section>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">B</span>
            <span className="text-sm font-semibold text-ink">Business OS</span>
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">{mode === 'login' ? 'Sign in' : 'Create your workspace'}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {mode === 'login' ? 'Use your email and password to continue.' : 'The first account becomes the workspace owner.'}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-md border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Account">
            {(['login', 'register'] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                role="tab"
                aria-selected={mode === nextMode}
                onClick={() => { setMode(nextMode); setError(''); }}
                className={cn('h-7 rounded text-[13px] transition-colors duration-150', mode === nextMode ? 'bg-surface font-medium text-ink shadow-card' : 'text-muted hover:text-ink')}>
                {nextMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-3.5" noValidate>
            {mode === 'register' && (
              <Field label="Your name" htmlFor="auth-name">
                <input id="auth-name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={cn(inputClass, 'h-9')} />
              </Field>
            )}
            <Field label="Email" htmlFor="auth-email">
              <input id="auth-email" type="email" autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className={cn(inputClass, 'h-9')} placeholder="you@company.com" />
            </Field>
            <Field label="Password" htmlFor="auth-password">
              <input id="auth-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className={cn(inputClass, 'h-9')} />
            </Field>
            {error && <p className="rounded-md bg-critical-soft px-3 py-2 text-[13px] text-critical" role="alert">{error}</p>}
            <Button type="submit" variant="primary" loading={busy} className="h-9 w-full">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-subtle">
            Ask your workspace owner for an account or password help. Email delivery is not configured.
          </p>
        </div>
      </div>
    </main>
  );
}
