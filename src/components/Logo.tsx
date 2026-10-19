/** FloodPath mark: a droplet with a path running through it. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.5c-3 3.9-6.2 7.6-6.2 11a6.2 6.2 0 0 0 12.4 0c0-3.4-3.2-7.1-6.2-11z" fill="#e6f3fa" />
      <path d="M7.6 15.2c1.5 1.3 2.9 1.3 4.4 0s2.9-1.3 4.4 0" fill="none" stroke="#247dce" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
