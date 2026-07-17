'use client';

import { useId, useMemo } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  VE_MOBILE_PREFIXES,
  composePhone,
  parsePhoneParts,
  validateVePhone,
  type PhoneValidationResult,
  type VeMobilePrefix,
} from '@/lib/validation/venezuela-phone';

type PhoneInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (normalizedOrFormatted: string) => void;
  onValidationChange?: (result: PhoneValidationResult) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
};

const selectClassName =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-[5.5rem] shrink-0 rounded-lg border bg-transparent px-2 text-sm font-semibold outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50';

export function PhoneInput({
  id,
  label = 'Teléfono',
  value,
  onChange,
  onValidationChange,
  error,
  disabled,
  required,
  className,
  inputClassName,
}: PhoneInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const parts = useMemo(() => parsePhoneParts(value), [value]);
  const result = useMemo(() => validateVePhone(value), [value]);
  const showFeedback = value.trim().length > 0;
  const invalid = Boolean(error) || (showFeedback && !result.valid);

  const emit = (prefix: VeMobilePrefix, number: string) => {
    const nextValue = composePhone(prefix, number);
    const next = validateVePhone(nextValue);
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
          aria-label="Prefijo telefónico"
          disabled={disabled}
          value={parts.prefix}
          className={cn(selectClassName, invalid && 'border-destructive')}
          onChange={(e) => emit(e.target.value as VeMobilePrefix, parts.number)}
        >
          {VE_MOBILE_PREFIXES.map((prefix) => (
            <option key={prefix} value={prefix}>
              {prefix}
            </option>
          ))}
        </select>
        <Input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="1234567"
          disabled={disabled}
          value={parts.number}
          aria-invalid={invalid}
          aria-describedby={hintId}
          className={cn('h-11 min-w-0 flex-1', inputClassName)}
          onChange={(e) => emit(parts.prefix, e.target.value.replace(/\D/g, '').slice(0, 7))}
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
          'Prefijo móvil + 7 dígitos (ej: 0412-1234567)'
        )}
      </p>
    </div>
  );
}
