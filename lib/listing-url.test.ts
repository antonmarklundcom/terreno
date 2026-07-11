import { describe, expect, it } from 'vitest';
import {
  listingSlugParam,
  listingPath,
  publicIdFromParam,
} from './listing-url';

/**
 * The listing-URL contract is an SEO identity ({slug}-{public_id}); a parse
 * that grabs the wrong segment sends the detail route to the wrong (or no)
 * listing. Pure, so tested the day it exists.
 */

const l = { slug: 'lote-esquina-en-luque-t-001', public_id: 'ab12cd34ef' };

describe('listingSlugParam / listingPath', () => {
  it('builds {slug}-{public_id}', () => {
    expect(listingSlugParam(l)).toBe('lote-esquina-en-luque-t-001-ab12cd34ef');
    expect(listingPath(l)).toBe(
      '/terreno/lote-esquina-en-luque-t-001-ab12cd34ef',
    );
  });
});

describe('publicIdFromParam', () => {
  it('extracts the trailing 10-hex id regardless of hyphens in the slug', () => {
    expect(publicIdFromParam(listingSlugParam(l))).toBe('ab12cd34ef');
    expect(publicIdFromParam('a-b-c-0123456789')).toBe('0123456789');
  });
  it('round-trips build → parse', () => {
    expect(publicIdFromParam(listingPath(l).replace('/terreno/', ''))).toBe(
      l.public_id,
    );
  });
  it('returns null when there is no id suffix', () => {
    expect(publicIdFromParam('lote-esquina-en-luque')).toBeNull();
    expect(publicIdFromParam('too-short-abc123')).toBeNull(); // 6 chars, not 10
  });
  it('is not fooled by non-hex trailing segments', () => {
    // 10 chars but contains g/z → not a public_id.
    expect(publicIdFromParam('barrio-santa-gzzzzzzzzz')).toBeNull();
  });
});
