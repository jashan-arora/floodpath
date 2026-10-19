import { BellRing, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Page } from '../../components/Panel';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useNow } from '../../store/simulation';
import { unreadCount, useAppStore } from '../../store/useAppStore';
import { AlertItem } from './AlertItem';

/** Alerts feed (CLAUDE.md 3.4b). */
export function AlertsScreen() {
  const alerts = useAppStore((s) => s.alerts);
  const markAll = useAppStore((s) => s.markAllAlertsRead);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const now = useNow();
  const unread = unreadCount(alerts);
  const shown = filter === 'unread' ? alerts.filter((a) => !a.read) : alerts;

  return (
    <Page>
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white via-page to-sky">
      <ScreenHeader
        title="Alerts"
        subtitle="Flood warnings for your saved route, your home and the streets around you."
        right={
          <Button variant="ghost" size="sm" className="-mr-2" disabled={unread === 0} onClick={markAll} icon={<CheckCheck size={16} aria-hidden />}>
            Mark all read
          </Button>
        }
      />
      <div className="flex gap-2 px-5 pb-3">
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        <Chip selected={filter === 'unread'} onClick={() => setFilter('unread')}>Unread {unread > 0 && <span className="tabular-nums">{unread}</span>}</Chip>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={<BellRing size={24} />} title="You’re up to date" body="New alerts about your route, home and nearby sensors will appear here." action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all alerts</Button>} />
      ) : (
        <div className="space-y-3 px-4 pb-6">
          {shown.map((a) => <AlertItem key={a.id} alert={a} now={now} />)}
        </div>
      )}
    </div>
    </Page>
  );
}
