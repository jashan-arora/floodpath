import { Camera } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/Button';
import { SAMPLE_PHOTO } from '../../data/reports';

interface Props {
  value?: string;
  onChange: (url?: string) => void;
}

/** Photo upload or camera. Images stay in the browser as object URLs. */
export function PhotoPicker({ value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Choose a JPG, PNG or HEIC photo.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('That photo is over 10 MB. Choose a smaller one.');
      return;
    }
    setError(null);
    onChange(URL.createObjectURL(file));
  };

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={onFile} aria-label="Choose a photo" tabIndex={-1} />
      {value ? (
        <div className="relative overflow-hidden rounded-control">
          <img src={value} alt="Your photo of the flooding" className="aspect-[16/10] w-full object-cover" />
          <div className="absolute inset-x-2 bottom-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" className="bg-white/95" onClick={() => input.current?.click()}>Replace</Button>
            <Button size="sm" variant="outline" className="bg-white/95" onClick={() => onChange(undefined)}>Remove</Button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full items-center gap-4 rounded-control border-2 border-dashed border-accent/35 bg-field px-4 py-5 text-left transition hover:border-accent/60 hover:bg-tint"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-tint-strong text-ink">
              <Camera size={24} aria-hidden />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">Take or add a photo</span>
              <span className="block text-[13px] text-muted">JPG, PNG or HEIC, up to 10 MB</span>
            </span>
          </button>
          <button type="button" onClick={() => onChange(SAMPLE_PHOTO)} className="mt-2 text-[13px] font-semibold text-link hover:underline">
            Use a sample photo
          </button>
        </>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-flooded-ink">{error}</p>}
    </div>
  );
}
