/** Misma lógica que la API (`catalog/utils/slug.util`). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function previewCompanySlug(name: string): string {
  return (slugify(name) || 'empresa').slice(0, 60);
}
