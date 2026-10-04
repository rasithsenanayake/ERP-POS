import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import type { IntegrationApp } from '../../types/integrations';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';

interface ConnectAppDrawerProps {
  app: IntegrationApp | null;
  onClose: () => void;
  onConnect: (app: IntegrationApp, account: string) => void;
}

export function ConnectAppDrawer({ app, onClose, onConnect }: ConnectAppDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setValues({});
    setError('');
    setVerifying(false);
  }, [app?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    const missing = app.fields.find((f) => !(values[f.key] ?? '').trim());
    if (missing) return setError(`Enter your ${missing.label.toLowerCase()}.`);
    setError('');
    setVerifying(true);
    window.setTimeout(() => {
      setVerifying(false);
      const visible = app.fields.find((f) => !f.secret);
      onConnect(app, visible ? `${visible.label}: ${values[visible.key].trim()}` : 'Connected via API key');
    }, 600);
  };

  return (
    <Drawer
      open={!!app}
      onClose={onClose}
      title={app ? `Connect ${app.name}` : ''}
      description={app?.description}
      dirty={Object.values(values).some(Boolean)}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="connect-form" loading={verifying}>
            {verifying ? 'Verifying…' : 'Connect'}
          </Button>
        </>
      }>
      
      {app &&
      <form id="connect-form" onSubmit={submit} className="space-y-4" noValidate>
          {app.fields.map((f) =>
        <Field key={f.key} label={f.label} htmlFor={`app-${f.key}`}>
              <input
            id={`app-${f.key}`}
            type={f.secret ? 'password' : 'text'}
            autoComplete="off"
            value={values[f.key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className={`${inputClass} ${f.secret ? 'font-mono' : ''}`} />
          
            </Field>
        )}
          {error &&
        <p className="text-xs text-critical" role="alert">
              {error}
            </p>
        }
          <p className="flex items-start gap-2 rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">
            <ShieldCheckIcon className="mt-px h-4 w-4 shrink-0" aria-hidden />
            Keys are encrypted at rest and never shown again. Only owners can view or change connections.
          </p>
        </form>
      }
    </Drawer>);

}