import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'surface' | 'plain' | 'dark';
  size?: number;
  ref?: Ref<HTMLButtonElement>;
}

const TONES = {
  surface: 'bg-white text-ink shadow-card hover:bg-page active:bg-tint',
  plain: 'text-ink hover:bg-tint active:bg-tint-strong',
  dark: 'bg-white/12 text-white hover:bg-white/20 active:bg-white/25',
};

export function IconButton({ label, children, tone = 'surface', size = 40, className = '', type = 'button', ref, ...rest }: Props) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition duration-150 active:scale-95 ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
