import { OctagonX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '../../components/Button';
import { journeyById } from '../../data/journeys';
import type { NavState } from '../../store/navigation';

/** First street the new route turns onto that the current one doesn't use, for "via Dodds St". */
function viaStreet(nav: NavState, toRouteId: string) {
  const routes = journeyById(nav.journeyId)?.routes ?? [];
  const streets = (id: string | null) =>
    (routes.find((r) => r.id === id)?.steps ?? []).map((s) => /onto (.+)$/.exec(s.instruction)?.[1]).filter((x): x is string => !!x);
  const current = new Set(streets(nav.routeId));
  return streets(toRouteId).find((s) => !current.has(s));
}

/** The live re-route interrupt (CLAUDE.md 3.3). */
export function RerouteBanner({ nav, onAccept, onDismiss, onShelter }: {
  nav: NavState; onAccept: () => void; onDismiss: () => void; onShelter: () => void;
}) {
  const prompt = nav.reroute;
  const acceptRef = useRef<HTMLButtonElement>(null);
  useEffect(() => acceptRef.current?.focus(), [prompt?.segmentId]);
  if (!prompt) return null;

  const via = prompt.toRouteId ? viaStreet(nav, prompt.toRouteId) : undefined;
  const delta = prompt.deltaMinutes ?? 0;
  const detail = prompt.toRouteId
    ? `${via ? `Go via ${via}. ` : ''}${delta > 0 ? `Adds ${delta} min, arriving in ${Math.round(prompt.etaMinutes ?? 0)} min.` : `Arrive in ${Math.round(prompt.etaMinutes ?? 0)} min.`}`
    : 'There is no clear route from here. Stop somewhere safe and wait for the water to drop.';

  return (
    <div role="alertdialog" aria-labelledby="reroute-title" aria-describedby="reroute-detail" className="animate-drop rounded-[18px] bg-white p-4 shadow-float ring-2 ring-flooded">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-flooded text-white">
          <OctagonX size={22} strokeWidth={2.4} aria-hidden />
        </span>
        <div className="min-w-0">
          <p id="reroute-title" className="text-[16px] leading-snug font-semibold">New flooding ahead on {prompt.streetName}. Reroute?</p>
          <p id="reroute-detail" className="mt-1 text-[14px] leading-snug text-muted">{detail}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onDismiss}>Keep route</Button>
        {prompt.toRouteId ? (
          <Button ref={acceptRef} onClick={onAccept}>Reroute</Button>
        ) : (
          <Button ref={acceptRef} onClick={onShelter}>Find a shelter</Button>
        )}
      </div>
    </div>
  );
}
