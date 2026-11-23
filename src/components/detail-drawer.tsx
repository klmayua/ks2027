'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Responsive deep-dive inspector.
 *
 * - Desktop (`lg:`): slides in from the right (`max-w-xl`), keeping dashboard context visible.
 * - Mobile (`< lg`): native-feeling bottom sheet (`rounded-t-2xl`, `max-h-[90dvh]`) with large
 *   44px touch targets, safe-area padding, and locked background scroll.
 */
export function DetailDrawer({
  open,
  onClose,
  onBack,
  backLabel,
  eyebrow,
  title,
  subtitle,
  tone = 'dark',
  children,
}: {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: 'dark' | 'ledger';
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLedger = tone === 'ledger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-end lg:items-stretch"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity"
      />

      {/* Sheet / Drawer panel */}
      <div
        className={`relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t shadow-2xl lg:h-full lg:max-h-none lg:max-w-xl lg:rounded-none lg:border-l lg:border-t-0 ${
          isLedger
            ? 'border-[--ledger-line] bg-[--ledger-surface] text-[--ledger-ink]'
            : 'border-line-bright bg-surface text-ink'
        }`}
      >
        <div className="pdp-bar h-[2px] w-full shrink-0" />

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 lg:hidden">
          <span
            className={`h-1 w-10 rounded-full ${
              isLedger ? 'bg-[--ledger-line]' : 'bg-line-bright'
            }`}
          />
        </div>

        {/* Sticky header */}
        <div
          className={`flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-6 ${
            isLedger ? 'border-[--ledger-line]' : 'border-line'
          }`}
        >
          <div className="min-w-0 flex-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`mb-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  isLedger
                    ? 'bg-[--ledger-raised] text-[--ledger-accent] hover:opacity-80'
                    : 'bg-surface-raised text-accent hover:text-ink'
                }`}
              >
                ← {backLabel ?? 'Back'}
              </button>
            )}
            {eyebrow && (
              <div
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  isLedger ? 'text-[--ledger-accent]' : 'text-accent'
                }`}
              >
                {eyebrow}
              </div>
            )}
            <h2 className="mt-0.5 text-base font-semibold leading-snug sm:text-lg">{title}</h2>
            {subtitle && (
              <p
                className={`mt-1 text-xs leading-relaxed ${
                  isLedger ? 'text-[--ledger-ink-muted]' : 'text-ink-muted'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors ${
              isLedger
                ? 'border-[--ledger-line] text-[--ledger-ink-muted] hover:bg-[--ledger-raised] hover:text-[--ledger-ink]'
                : 'border-line bg-surface-raised text-ink-muted hover:border-line-bright hover:text-ink'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
