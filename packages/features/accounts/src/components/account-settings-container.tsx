'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { If } from '@kit/ui/if';
import { LanguageSelector } from '@kit/ui/language-selector';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { Trans } from '@kit/ui/trans';

import { usePersonalAccountData } from '../hooks/use-personal-account-data';
import { AccountDangerZone } from './account-danger-zone';
import { UpdateEmailFormContainer } from './email/update-email-form-container';
import { UpdatePasswordFormContainer } from './password/update-password-container';
import { UpdateAccountDetailsFormContainer } from './update-account-details-form-container';

export function PersonalAccountSettingsContainer(
  props: React.PropsWithChildren<{
    userId: string;

    features: {
      enableAccountDeletion: boolean;
      enablePasswordUpdate: boolean;
    };

    paths: {
      callback: string;
    };

    /** Called before refetch when user clicks Retry (e.g. to ensure account row exists). */
    onRetry?: () => Promise<unknown>;
  }>,
) {
  const supportsLanguageSelection = useSupportMultiLanguage();
  const user = usePersonalAccountData(props.userId);
  const ensuredOnce = useRef(false);

  const handleRetry = async () => {
    await props.onRetry?.();
    await user.refetch();
  };

  // When account is missing, try to create it once on mount so user doesn't have to click Retry
  useEffect(() => {
    if (user.isError && props.onRetry && !ensuredOnce.current) {
      ensuredOnce.current = true;
      props.onRetry().then(() => user.refetch());
    }
  }, [user.isError, props.onRetry]);

  if (user.isPending && !user.data) {
    return <LoadingOverlay fullPage />;
  }

  // When account row is missing or fetch failed, render with minimal data so the page is still usable
  const account = user.data ?? {
    id: props.userId,
    name: null,
    picture_url: null,
  };

  return (
    <div className={'flex w-full flex-col space-y-4 pb-32'}>
      {user.isError && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="account:loadError" />
            </CardTitle>
            <CardDescription>
              <Trans i18nKey="account:loadErrorDescription" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => handleRetry()}
              className="text-primary hover:underline"
            >
              <Trans i18nKey="common:retry" />
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey={'account:name'} />
          </CardTitle>

          <CardDescription>
            <Trans i18nKey={'account:nameDescription'} />
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UpdateAccountDetailsFormContainer user={account} />
        </CardContent>
      </Card>

      <If condition={supportsLanguageSelection}>
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey={'account:language'} />
            </CardTitle>

            <CardDescription>
              <Trans i18nKey={'account:languageDescription'} />
            </CardDescription>
          </CardHeader>

          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>
      </If>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey={'account:updateEmailCardTitle'} />
          </CardTitle>

          <CardDescription>
            <Trans i18nKey={'account:updateEmailCardDescription'} />
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UpdateEmailFormContainer callbackPath={props.paths.callback} />
        </CardContent>
      </Card>

      <If condition={props.features.enablePasswordUpdate}>
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey={'account:updatePasswordCardTitle'} />
            </CardTitle>

            <CardDescription>
              <Trans i18nKey={'account:updatePasswordCardDescription'} />
            </CardDescription>
          </CardHeader>

          <CardContent>
            <UpdatePasswordFormContainer callbackPath={props.paths.callback} />
          </CardContent>
        </Card>
      </If>

      <If condition={props.features.enableAccountDeletion}>
        <Card className={'border-destructive'}>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey={'account:dangerZone'} />
            </CardTitle>

            <CardDescription>
              <Trans i18nKey={'account:dangerZoneDescription'} />
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AccountDangerZone />
          </CardContent>
        </Card>
      </If>
    </div>
  );
}

function useSupportMultiLanguage() {
  const { i18n } = useTranslation();
  const langs = (i18n?.options?.supportedLngs as string[]) ?? [];

  const supportedLangs = langs.filter((lang) => lang !== 'cimode');

  return supportedLangs.length > 1;
}
