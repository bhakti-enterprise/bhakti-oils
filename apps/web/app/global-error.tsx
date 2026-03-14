'use client';

import Link from 'next/link';

import { ArrowLeft, MessageCircle } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { SiteHeader } from '~/(marketing)/_components/site-header';

const GlobalErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  console.error(error);

  const errorMessage =
    typeof error?.message === 'string' ? error.message : null;
  const errorDigest = typeof error?.digest === 'string' ? error.digest : null;

  return (
    <html>
      <body>
        <div className={'flex h-screen flex-1 flex-col'}>
          <SiteHeader />

          <div
            className={
              'container m-auto flex w-full flex-1 flex-col items-center justify-center'
            }
          >
            <div className={'flex flex-col items-center space-y-8'}>
              <div>
                <h1 className={'font-heading text-9xl font-semibold'}>
                  <Trans i18nKey={'common:errorPageHeading'} fallback="Ouch! :|" />
                </h1>
              </div>

              <div className={'flex flex-col items-center space-y-8'}>
                <div
                  className={
                    'flex max-w-xl flex-col items-center space-y-1 text-center'
                  }
                >
                  <div>
                    <Heading level={2}>
                      <Trans
                        i18nKey={'common:genericError'}
                        fallback="Sorry, something went wrong."
                      />
                    </Heading>
                  </div>

                  <p className={'text-muted-foreground text-lg'}>
                    <Trans
                      i18nKey={'common:genericErrorSubHeading'}
                      fallback="An error occurred. Check the browser console or Vercel logs for details."
                    />
                  </p>

                  {(errorMessage || errorDigest) && (
                    <p
                      className={
                        'text-muted-foreground mt-4 rounded border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 font-mono text-sm'
                      }
                      title="Error details"
                    >
                      {errorMessage ?? null}
                      {errorDigest && (
                        <span className={'block mt-1 text-xs'}>
                          Digest: {errorDigest}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <Button
                    className={'w-full'}
                    variant={'default'}
                    onClick={reset}
                  >
                    <ArrowLeft className={'mr-2 h-4'} />
                    <Trans i18nKey={'common:goBack'} fallback="Go back" />
                  </Button>

                  <Button className={'w-full'} variant={'outline'} asChild>
                    <Link href={pathsConfig.auth.signIn}>
                      <MessageCircle className={'mr-2 h-4'} />
                      <Trans i18nKey={'common:contactUs'} fallback="Sign in" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalErrorPage;
