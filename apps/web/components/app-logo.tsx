import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 180,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      src="/images/bhakti-logo.png"
      alt="Bhakti"
      width={width}
      height={40}
      className={cn('h-auto w-[140px] lg:w-[180px]', className)}
      priority
    />
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
