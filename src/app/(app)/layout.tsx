import { AppChrome } from '@/components/layout/AppChrome'

/** Every page of the app proper; the intro page (/welcome) stands on its own. */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <AppChrome>{children}</AppChrome>
}
