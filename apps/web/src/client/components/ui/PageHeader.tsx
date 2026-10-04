import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, StarIcon } from 'lucide-react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  badges?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  backTo?: {to: string;label: string;};
  favoriteLabel?: string;
}

export function PageHeader({ title, badges, meta, actions, backTo, favoriteLabel }: PageHeaderProps) {
  const location = useLocation();
  const { isFavorite, toggleFavorite } = usePreferences();
  const path = location.pathname;
  const pinned = isFavorite(path);

  return (
    <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        {backTo &&
        <Link
          to={backTo.to}
          aria-label={`Back to ${backTo.label}`}
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
          
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        }
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-ink md:text-2xl">{title}</h1>
            {badges}
            <button
              type="button"
              onClick={() => toggleFavorite({ path, label: favoriteLabel ?? title })}
              aria-pressed={pinned}
              aria-label={pinned ? 'Remove from favorites' : 'Add to favorites'}
              title={pinned ? 'Remove from favorites' : 'Add to favorites'}
              className="no-print inline-flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
              
              <StarIcon className={cn('h-4 w-4', pinned && 'fill-warning text-warning')} />
            </button>
          </div>
          {meta && <div className="mt-1 text-[13px] text-muted">{meta}</div>}
        </div>
      </div>
      {actions && <div className="no-print flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>);

}