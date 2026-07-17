import { describe, expect, it } from 'vitest';
import { previewCompanySlug, slugify } from './slug';

describe('slugify / previewCompanySlug', () => {
  it('normaliza acentos y espacios', () => {
    expect(slugify('El Bodegón Express')).toBe('el-bodegon-express');
    expect(previewCompanySlug('Mi Tienda')).toBe('mi-tienda');
  });

  it('usa empresa si el nombre queda vacío', () => {
    expect(previewCompanySlug('***')).toBe('empresa');
  });
});
