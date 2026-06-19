import Link from 'next/link';

/** terreno.com.py wordmark — ".com.py" rendered muted, per the design. */
export function Wordmark({
  className = '',
  tld = 'text-ink-faintest',
  href = '/',
}: {
  className?: string;
  tld?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={`font-bold tracking-tight2 ${className}`}>
      terreno<span className={`font-medium ${tld}`}>.com.py</span>
    </Link>
  );
}
