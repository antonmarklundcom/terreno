import type { Metadata } from 'next';
import { getFacets, getListingsResult } from '@/lib/listings-repo';
import { listingQuerySchema } from '@/lib/validation';
import { tipoLabel } from '@/lib/format';
import type { ListingFilters } from '@/lib/types';
import { SearchView } from '@/components/search-view';

// Infinite filter combinations → dynamic SSR (not indexed for arbitrary filters).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Buscar terrenos',
  description:
    'Buscá lotes, campos, quintas y loteamientos en Paraguay. Filtrá por ubicación, tipo, superficie, precio, servicios y estado de título sobre un mapa real.',
  robots: { index: false, follow: true },
};

type SP = Record<string, string | string[] | undefined>;

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const raw = await searchParams;
  const parsed = listingQuerySchema.safeParse(raw);
  const filters: ListingFilters = parsed.success
    ? (parsed.data as ListingFilters)
    : {};

  const [{ data, total }, facets] = await Promise.all([
    getListingsResult({ ...filters, per_page: 60 }),
    getFacets(),
  ]);

  const summaryParts = [
    filters.ciudad ?? filters.departamento,
    filters.tipo ? tipoLabel(filters.tipo) : undefined,
  ].filter(Boolean);
  const summary = summaryParts.length
    ? summaryParts.join(' · ')
    : 'Todo Paraguay';

  return (
    <SearchView
      listings={data}
      total={total}
      facets={facets}
      summary={summary}
    />
  );
}
