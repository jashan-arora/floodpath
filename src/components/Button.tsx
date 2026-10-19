import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft active:bg-ink-deep disabled:bg-subtle',
  accent: 'bg-accent text-white hover:bg-accent-strong active:bg-link disabled:bg-subtle',
  secondary: 'bg-tint text-ink hover:bg-tint-strong active:bg-sky',
  ghost: 'text-ink hover:bg-tint active:bg-tint-strong',
  outline: 'border border-line bg-white text-ink hover:bg-page active:bg-tint',
  danger: 'bg-flooded-tint text-flooded-ink hover:bg-[#fbdcda] active:bg-[#f8cbc8]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-sm',
  md: 'h-11 gap-2 px-4 text-[15px]',
  lg: 'h-[52px] gap-2 px-5 text-base',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ variant = 'primary', size = 'md', block, icon, className = '', children, type = 'button', ref, ...rest }: Props) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-control font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
