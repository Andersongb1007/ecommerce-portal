'use client';

import { useId, useMemo } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  RIF_LETTERS,
  composeRif,
  parseRifParts,
  validateRif,
  type IdValidationResult,
  type RifLetter,
} from '@/lib/validation/venezuela-id';

type RifInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (normalizedOrFormatted: string) => void;
  onValidationChange?: (result: IdValidationResult) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
};

const selectClassName =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-[4.5rem] shrink-0 rounded-lg border bg-transparent px-2 text-sm font-semibold outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50';

export function RifInput({
  id,
  label = 'RIF',
  value,
  onChange,
  onValidationChange,
  error,
  disabled,
  required,
  className,
  inputClassName,
}: RifInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const checkId = `${inputId}-check`;
  const hintId = `${inputId}-hint`;
  const parts = useMemo(() => parseRifParts(value), [value]);
  const result = useMemo(() => validateRif(value), [value]);
  const showFeedback = value.trim().length > 0;
  const invalid = Boolean(error) || (showFeedback && !result.valid);

  const emit = (letter: RifLetter, body: string, check: string) => {
    const nextValue = composeRif(letter, body, check);
    const next = validateRif(nextValue);
    onChange(nextValue);
    onValidationChange?.(next);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required ? ' *' : ''}
        </Label>
      )}
      <div className="flex min-w-0 gap-2">
        <select
          aria-label="Tipo de RIF"
          disabled={disabled}
          value={parts.letter}
          className={cn(selectClassName, invalid && 'border-destructive')}
          onChange={(e) => emit(e.target.value as RifLetter, parts.body, parts.check)}
        >
          {RIF_LETTERS.map((letter) => (
            <option key={letter} value={letter}>
              {letter}
            </option>
          ))}
        </select>
        <Input
          id={inputId}
          inputMode="numeric"
          autoComplete="off"
          placeholder="29577829"
          disabled={disabled}
          value={parts.body}
          aria-invalid={invalid}
          aria-describedby={hintId}
          className={cn('h-11 min-w-0 flex-1', inputClassName)}
          onChange={(e) =>
            emit(parts.letter, e.target.value.replace(/\D/g, '').slice(0, 8), parts.check)
          }
        />
        <Input
          id={checkId}
          inputMode="numeric"
          autoComplete="off"
          placeholder="#"
          disabled={disabled}
          value={parts.check}
          aria-label="Dígito verificador"
          aria-invalid={invalid}
          aria-describedby={hintId}
          className={cn('h-11 w-12 shrink-0 px-2 text-center', inputClassName)}
          onChange={(e) =>
            emit(parts.letter, parts.body, e.target.value.replace(/\D/g, '').slice(0, 1))
          }
          onBlur={() => {
            if (result.valid) {
              onChange(result.normalized);
              onValidationChange?.(result);
            }
          }}
        />
      </div>
      <p
        id={hintId}
        className={cn(
          'flex items-start gap-1.5 text-xs',
          error || (showFeedback && !result.valid)
            ? 'font-medium text-rose-600'
            : showFeedback && result.valid
              ? 'font-medium text-emerald-600'
              : 'text-muted-foreground'
        )}
        role={invalid ? 'alert' : undefined}
      >
        {error ? (
          <>
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </>
        ) : showFeedback && result.valid ? (
          <>
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {result.message}
          </>
        ) : showFeedback ? (
          <>
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {result.message}
          </>
        ) : (
          'Tipo + 8 dígitos + verificador SENIAT (ej: V-29577829-2)'
        )}
      </p>
    </div>
  );
}
