import { redirect } from 'next/navigation';

import pathsConfig from '~/config/paths.config';

export default function NewOrderPage() {
  redirect(pathsConfig.app.home);
}
