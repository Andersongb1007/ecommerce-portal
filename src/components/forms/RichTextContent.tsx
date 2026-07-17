'use client';

import { cn } from '@/lib/utils';

type RichTextContentProps = {
  html: string;
  className?: string;
};

const ALLOWED_TAGS =
  'p|br|strong|em|b|i|u|s|strike|h2|h3|ul|ol|li|blockquote|hr|table|thead|tbody|tr|th|td|div|span';

/** Renderiza HTML tipográfico TipTap (sin imágenes). */
export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = sanitizeRichHtml(html);
  if (!sanitized) return null;

  return (
    <div
      className={cn(
        'rich-content text-foreground max-w-none text-sm',
        '[&_em]:italic [&_strong]:font-semibold [&_u]:underline',
        '[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

function sanitizeRichHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<img\b[^>]*>/gi, '')
    .replace(
      /<\/?(?:picture|source|figure|video|audio|iframe|script|style|object|embed)\b[^>]*>/gi,
      ''
    )
    .replace(new RegExp(`<(?!\\/?(?:${ALLOWED_TAGS})\\b)[^>]*>`, 'gi'), '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '');
}
