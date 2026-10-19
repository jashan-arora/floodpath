import { ExternalLink } from 'lucide-react';
import { Page } from '../../components/Panel';
import { ScreenHeader } from '../../components/ScreenHeader';

const RESOURCES = [
  { title: 'Returning home safely', source: 'VICSES', url: 'https://www.ses.vic.gov.au', body: 'Check for structural damage, turn off power at the switchboard, and photograph damage for insurance before cleaning up.' },
  { title: 'Clean-up and waste collection', source: 'City of Melbourne', url: 'https://www.melbourne.vic.gov.au', body: 'Extra hard-waste pickups run in Southbank this week. Put flood-damaged items on the kerb by 7 am.' },
  { title: 'Financial assistance', source: 'VicEmergency', url: 'https://emergency.vic.gov.au', body: 'Emergency relief payments are available for households affected by the flooding.' },
  { title: 'Drinking water advice', source: 'Melbourne Water', url: 'https://www.melbournewater.com.au', body: 'Tap water in Southbank is safe to drink. Do not swim in or touch the Yarra until further notice.' },
];

/** Static screen for the Figma "Further information" tile. */
export function InfoScreen() {
  return (
    <Page>
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-page">
      <ScreenHeader back="/hub" title="Further information" subtitle="Recovery resources and official updates for Southbank." />
      <ul className="space-y-2 px-4 pb-6">
        {RESOURCES.map((r) => (
          <li key={r.title}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-start gap-3 rounded-card bg-white p-4 text-left shadow-card transition hover:shadow-float"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-muted">{r.source}</p>
                <p className="text-[15px] font-semibold">{r.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{r.body}</p>
              </div>
              <ExternalLink size={17} className="mt-1 shrink-0 text-ink-soft" aria-hidden />
              <span className="sr-only">(opens {r.source} website in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
    </Page>
  );
}
