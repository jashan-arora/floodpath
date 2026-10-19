import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore, type Toast } from '../store/useAppStore';

const TONE = {
  info: { Icon: Info, icon: 'text-accent' },
  success: { Icon: CircleCheck, icon: 'text-clear' },
  warning: { Icon: TriangleAlert, icon: 'text-caution' },
  danger: { Icon: OctagonX, icon: 'text-flooded' },
};

const TTL_MS = 5000;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useAppStore((s) => s.dismissToast);
  const focusOn = useAppStore((s) => s.focusOn);
  const navigate = useNavigate();
  const { Icon, icon } = TONE[toast.tone];

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), TTL_MS);
    return () => window.clearTimeout(id);
  }, [toast.id, dismiss]);

  const act = () => {
    if (toast.action?.focus) focusOn(toast.action.focus);
    if (toast.action?.to) navigate(toast.action.to);
    dismiss(toast.id);
  };

  return (
    <div role="status" className="pointer-events-auto flex animate-drop items-start gap-3 rounded-card bg-ink-deep/95 p-3 pr-2 text-white shadow-float backdrop-blur">
      <Icon size={20} strokeWidth={2.4} className={`mt-0.5 shrink-0 ${icon}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-snug">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-[13px] leading-snug text-white/75">{toast.body}</p>}
        {toast.action && (
          <button type="button" onClick={act} className="mt-1.5 text-[13px] font-semibold text-[#8cc8f5] hover:text-white">
            {toast.action.label}
          </button>
        )}
      </div>
      <button type="button" aria-label="Dismiss" onClick={() => dismiss(toast.id)} className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

/** In-app banners stand in for push notifications (CLAUDE.md section 12). */
export function Toaster() {
  const toasts = useAppStore((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-3 top-[max(env(safe-area-inset-top),12px)] z-50 flex flex-col gap-2 lg:inset-x-auto lg:top-auto lg:bottom-20 lg:left-1/2 lg:w-[420px] lg:-translate-x-1/2 lg:flex-col-reverse">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
