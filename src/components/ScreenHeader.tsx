import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { IconButton } from './IconButton';

interface Props {
  title: string;
  subtitle?: ReactNode;
  back?: boolean | string;
  right?: ReactNode;
}

/** Large Lexend title, as on the Figma Live Map and Report screens. */
export function ScreenHeader({ title, subtitle, back, right }: Props) {
  const navigate = useNavigate();
  return (
    <header className="px-5 pt-5 pb-3">
      <div className="flex items-center justify-between gap-3">
        {back ? (
          <IconButton label="Back" tone="plain" className="-ml-2" onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}>
            <ArrowLeft size={22} />
          </IconButton>
        ) : <span />}
        {right}
      </div>
      <h1 className={`text-[30px] font-bold leading-[1.1] tracking-[-0.01em] text-ink ${back ? 'mt-1' : '-mt-1'}`}>{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-[34ch] text-[15px] leading-snug text-muted">{subtitle}</p>}
    </header>
  );
}
