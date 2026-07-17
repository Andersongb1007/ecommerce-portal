'use client';

import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  CornerDownLeft,
} from 'lucide-react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type FormattedTextareaProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Límite de caracteres de texto visible (no cuenta etiquetas HTML). */
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  /** TipTap WYSIWYG (MIT). Si false, textarea plano. */
  formatting?: boolean;
  className?: string;
};

function stripImages(html: string): string {
  return html
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<\/?picture\b[^>]*>/gi, '')
    .replace(/<\/?source\b[^>]*>/gi, '')
    .replace(/<\/?figure\b[^>]*>/gi, '');
}

/** Normaliza HTML vacío de TipTap a string vacío. */
export function normalizeRichHtml(html: string | undefined | null): string {
  if (!html) return '';
  const trimmed = html.replace(/\s+/g, ' ').trim();
  if (
    !trimmed ||
    trimmed === '<p></p>' ||
    trimmed === '<p><br></p>' ||
    trimmed === '<p><br/></p>'
  ) {
    return '';
  }
  return html;
}

function FieldShell({
  label,
  required,
  inputId,
  className,
  children,
  hintId,
  error,
  hint,
}: {
  label?: string;
  required?: boolean;
  inputId: string;
  className?: string;
  children: React.ReactNode;
  hintId: string;
  error?: string;
  hint?: ReactNode;
}) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required ? ' *' : ''}
        </Label>
      )}
      {children}
      <p
        id={hintId}
        className={cn('text-xs', error ? 'font-medium text-rose-600' : 'text-muted-foreground')}
        role={error ? 'alert' : undefined}
      >
        {error ?? hint}
      </p>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'hover:bg-background inline-flex h-8 w-8 items-center justify-center rounded-md text-sm disabled:opacity-40',
        active && 'bg-background text-foreground shadow-sm'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="bg-border mx-0.5 h-5 w-px shrink-0" aria-hidden />;
}

function RichToolbar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  if (!editor) return null;
  const off = Boolean(disabled);

  return (
    <div className="bg-muted/40 flex w-max min-w-full flex-nowrap items-center gap-0.5 px-1.5 py-1.5">
      <ToolbarButton
        label="Deshacer"
        disabled={off || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Rehacer"
        disabled={off || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Negrita"
        active={editor.isActive('bold')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Cursiva"
        active={editor.isActive('italic')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Subrayado"
        active={editor.isActive('underline')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Tachado"
        active={editor.isActive('strike')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Título 2"
        active={editor.isActive('heading', { level: 2 })}
        disabled={off}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Título 3"
        active={editor.isActive('heading', { level: 3 })}
        disabled={off}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Lista con viñetas"
        active={editor.isActive('bulletList')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={editor.isActive('orderedList')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Cita"
        active={editor.isActive('blockquote')}
        disabled={off}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Línea horizontal"
        disabled={off}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Salto de línea"
        disabled={off}
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        <CornerDownLeft className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Alinear izquierda"
        active={editor.isActive({ textAlign: 'left' })}
        disabled={off}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Centrar"
        active={editor.isActive({ textAlign: 'center' })}
        disabled={off}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Alinear derecha"
        active={editor.isActive({ textAlign: 'right' })}
        disabled={off}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Insertar tabla"
        disabled={off}
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Fila debajo"
        disabled={off || !editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <Plus className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Columna a la derecha"
        disabled={off || !editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <span className="text-[10px] leading-none font-bold">+C</span>
      </ToolbarButton>
      <ToolbarButton
        label="Eliminar tabla"
        disabled={off || !editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

function PlainTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength = 150,
  rows = 4,
  disabled,
  required,
  error,
  hint,
  className,
}: Omit<FormattedTextareaProps, 'formatting'>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <FieldShell
      label={label}
      required={required}
      inputId={inputId}
      className={className}
      hintId={hintId}
      error={error}
      hint={hint ?? `${value.length}/${maxLength}`}
    >
      <Textarea
        id={inputId}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={hintId}
        className="min-h-[96px]"
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
      />
    </FieldShell>
  );
}

function TipTapTextarea({
  id,
  label,
  value,
  onChange,
  placeholder = 'Escribe aquí…',
  maxLength = 2000,
  disabled,
  required,
  error,
  hint,
  className,
}: Omit<FormattedTextareaProps, 'formatting' | 'rows'>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        // Underline ya viene en StarterKit v3; no registrar otra vez.
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: { class: 'rich-table' },
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    [maxLength, placeholder]
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        id: inputId,
        class: cn(
          'rich-editor ProseMirror max-w-none min-h-[140px] px-3 py-2.5 text-sm outline-none',
          '[&_p]:my-2 [&_blockquote]:my-2',
          '[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold',
          '[&_h3]:mt-2 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold',
          '[&_strong]:font-semibold [&_em]:italic [&_u]:underline'
        ),
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': hintId,
      },
      transformPastedHTML: (html) => stripImages(html),
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files && Array.from(files).some((f) => f.type.startsWith('image/'))) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (items && Array.from(items).some((i) => i.type.startsWith('image/'))) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : stripImages(ed.getHTML());
      onChangeRef.current(normalizeRichHtml(html));
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const current = normalizeRichHtml(editor.isEmpty ? '' : editor.getHTML());
    const incoming = normalizeRichHtml(value);
    if (incoming !== current) {
      editor.commands.setContent(incoming || '', { emitUpdate: false });
    }
  }, [value, editor]);

  const chars = editor?.storage.characterCount.characters() ?? 0;

  return (
    <FieldShell
      label={label}
      required={required}
      inputId={inputId}
      className={className}
      hintId={hintId}
      error={error}
      hint={hint ?? 'TipTap (MIT): títulos, listas, tablas, alineación… Sin imágenes.'}
    >
      <div
        className={cn(
          'border-input min-w-0 overflow-hidden rounded-lg border bg-transparent',
          error && 'border-destructive',
          disabled && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-1 border-b">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <RichToolbar editor={editor} disabled={disabled} />
          </div>
          <span className="text-muted-foreground shrink-0 px-2 py-2 text-[11px] tabular-nums">
            {chars}/{maxLength}
          </span>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </FieldShell>
  );
}

/** Descripción con TipTap (MIT) o textarea plano. */
export function FormattedTextarea({ formatting = true, ...props }: FormattedTextareaProps) {
  if (!formatting) {
    return <PlainTextarea {...props} />;
  }
  return <TipTapTextarea {...props} />;
}
