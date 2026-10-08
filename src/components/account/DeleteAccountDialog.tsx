'use client'

import { useTranslations } from 'next-intl'
import { AlertDialog } from 'radix-ui'
import { useFormStatus } from 'react-dom'
import { deleteAccountAction } from '@/app/account/actions'
import { buttonClasses } from '@/components/ui/button'

function ConfirmButton() {
  const t = useTranslations('account')
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={buttonClasses({ variant: 'danger' })}
    >
      {t('deleteConfirm')}
    </button>
  )
}

/** Asks before deleting: the account, profile and Pro access cannot be recovered. */
export function DeleteAccountDialog() {
  const t = useTranslations('account')
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        className={buttonClasses({ variant: 'ghost', className: 'text-danger' })}
      >
        {t('deleteOpen')}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="settings-overlay fixed inset-0 z-[100] bg-fg/40" />
        <AlertDialog.Content className="fixed start-1/2 top-1/2 z-[101] w-[min(28rem,calc(100%-2rem))] -translate-y-1/2 rounded-card bg-surface p-6 shadow-xl ltr:-translate-x-1/2 rtl:translate-x-1/2">
          <AlertDialog.Title className="text-xl font-extrabold">
            {t('deleteTitle')}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-fg-muted">
            {t('deleteBody')}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel className={buttonClasses({ variant: 'secondary' })}>
              {t('cancel')}
            </AlertDialog.Cancel>
            <form action={deleteAccountAction}>
              <ConfirmButton />
            </form>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
