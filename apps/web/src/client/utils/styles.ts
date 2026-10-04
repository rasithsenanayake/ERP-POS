export const inputClass =
'h-8 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-subtle shadow-[inset_0_1px_0_rgb(26_26_25/0.03)] transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface-2 disabled:text-muted';

export const selectClass = `${inputClass} appearance-none bg-[length:16px] bg-[right_6px_center] bg-no-repeat pr-7`;

export const textareaClass =
'w-full rounded-md border border-line-strong bg-surface px-2.5 py-2 text-[13px] text-ink placeholder:text-subtle transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

export const selectChevron = {
  backgroundImage:
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235c5c58'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z'/%3E%3C/svg%3E\")"
};

export const ease = [0.23, 1, 0.32, 1] as const;