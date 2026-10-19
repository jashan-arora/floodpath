import { Chip } from '../../components/Chip';
import { activeQuickFilter, useAppStore, type QuickFilter } from '../../store/useAppStore';

const FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'flooding', label: 'Flooding' },
  { id: 'roads', label: 'Roads' },
  { id: 'transport', label: 'Transport' },
  { id: 'services', label: 'Services' },
];

/** Figma's four quick filters. Tapping one shows that group alone; tapping it again restores the default view. */
export function FilterChips({ stretch = true }: { stretch?: boolean }) {
  const active = useAppStore((s) => activeQuickFilter(s.layers));
  const apply = useAppStore((s) => s.applyQuickFilter);
  return (
    <div
      role="group"
      aria-label="Quick filters"
      className={`no-scrollbar flex gap-2 overflow-x-auto py-1 ${stretch ? '-mx-3 px-3 [&>button]:flex-1 [&>button]:justify-center [&>button]:px-3' : ''}`}
    >
      {FILTERS.map(({ id, label }) => (
        <Chip key={id} selected={active === id} onClick={() => apply(id)} className={active === id ? '' : 'bg-white/95 shadow-card backdrop-blur hover:bg-white'}>
          {label}
        </Chip>
      ))}
    </div>
  );
}
