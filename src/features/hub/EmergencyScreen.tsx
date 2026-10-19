import { Phone } from 'lucide-react';
import { Page } from '../../components/Panel';
import { ScreenHeader } from '../../components/ScreenHeader';

const CONTACTS = [
  { name: 'Emergency', number: '000', detail: 'Life-threatening emergencies: police, fire, ambulance', urgent: true },
  { name: 'VICSES', number: '132 500', detail: 'Flood and storm help, sandbags, fallen trees' },
  { name: 'VicEmergency Hotline', number: '1800 226 226', detail: 'Warnings, relief and recovery information' },
  { name: 'NURSE-ON-CALL', number: '1300 60 60 24', detail: 'Health advice from a registered nurse, 24 hours' },
  { name: 'City of Melbourne', number: '03 9658 9658', detail: 'Council services, drains and road closures' },
];

/** Static screen for the Figma "Emergency services" tile. Numbers open the phone's dialler. */
export function EmergencyScreen() {
  return (
    <Page>
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-page">
      <ScreenHeader back="/hub" title="Emergency services" subtitle="If someone is in danger, call 000. Never enter floodwater." />
      <ul className="space-y-2 px-4 pb-6">
        {CONTACTS.map((c) => (
          <li key={c.name} className={`flex items-center gap-3 rounded-card bg-white p-4 shadow-card ${c.urgent ? 'ring-2 ring-flooded/40' : ''}`}>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{c.name}</p>
              <p className="text-[13px] leading-snug text-muted">{c.detail}</p>
            </div>
            <a
              href={`tel:${c.number.replace(/\s/g, '')}`}
              aria-label={`Call ${c.name} on ${c.number}`}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold tabular-nums transition active:scale-95 ${c.urgent ? 'bg-flooded text-white hover:bg-flooded-ink' : 'bg-tint text-ink hover:bg-tint-strong'}`}
            >
              <Phone size={15} aria-hidden />
              {c.number}
            </a>
          </li>
        ))}
      </ul>
    </div>
    </Page>
  );
}
