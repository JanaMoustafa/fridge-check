import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'
import type { ProfileFormState } from '@/app/profile/actions'
import { ProfileForm } from './ProfileForm'

const action = vi.hoisted(() => ({
  result: {} as ProfileFormState,
  calls: [] as FormData[],
}))
vi.mock('@/app/profile/actions', () => ({
  saveProfileAction: async (_state: ProfileFormState, formData: FormData) => {
    action.calls.push(formData)
    return action.result
  },
}))

const saved = {
  weightKg: 72.5,
  heightCm: 168,
  birthYear: 1994,
  sex: 'female' as const,
  activityLevel: 'moderate' as const,
  goal: 'lose_fat' as const,
  mealSplit: { breakfast: 20, lunch: 40, dinner: 30, snacks: 10 },
}

function renderForm(
  props: Partial<Parameters<typeof ProfileForm>[0]> = {},
  locale: 'en' | 'ar' = 'en',
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en} timeZone="UTC">
      <ProfileForm initial={null} next={null} {...props} />
    </NextIntlClientProvider>,
  )
}

describe('ProfileForm', () => {
  it('starts with the default meal split and no answers for a new user', () => {
    renderForm()
    expect(screen.getByLabelText('Weight')).toHaveValue('')
    expect(screen.getByLabelText('Breakfast')).toHaveValue('25')
    expect(screen.getByText('Total: 100%')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /I agree/ })).not.toBeChecked()
  })

  it('fills in a saved profile for editing', () => {
    renderForm({ initial: saved })
    expect(screen.getByLabelText('Weight')).toHaveValue('72.5')
    expect(screen.getByLabelText('Year of birth')).toHaveValue('1994')
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Moderately active/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Lose fat/ })).toBeChecked()
    expect(screen.getByLabelText('Lunch')).toHaveValue('40')
    expect(screen.getByRole('checkbox', { name: /I agree/ })).toBeChecked()
  })

  it('keeps a live total of the meal split', async () => {
    renderForm()
    const snacks = screen.getByLabelText('Snacks')
    await userEvent.clear(snacks)
    await userEvent.type(snacks, '15')
    expect(screen.getByText('Total: 105%')).toBeInTheDocument()
  })

  it('submits every field, and shows the server’s errors next to the fields', async () => {
    action.result = {
      errors: { weightKg: 'range', sex: 'required', consent: 'consent' },
      values: { weightKg: '500' },
    }
    renderForm({ next: '/recipe/local/53027' })
    await userEvent.type(screen.getByLabelText('Weight'), '500')
    await userEvent.click(screen.getByRole('button', { name: 'Save and calculate' }))

    const sent = action.calls.at(-1)!
    expect(sent.get('weightKg')).toBe('500')
    expect(sent.get('next')).toBe('/recipe/local/53027')
    expect(sent.get('breakfast')).toBe('25')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please check the highlighted fields.',
    )
    const weight = screen.getByLabelText('Weight')
    expect(weight).toHaveAttribute('aria-invalid', 'true')
    expect(weight).toHaveAccessibleDescription('Enter a weight between 30 and 300 kg.')
    expect(weight).toHaveValue('500')
    expect(screen.getByText('Please choose one.')).toBeInTheDocument()
    expect(screen.getByText('Please agree so we can store your details.')).toBeInTheDocument()
  })

  it('says when saving failed', async () => {
    action.result = { failed: true, values: {} }
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: 'Save and calculate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t save your profile'.replace('’', "'"),
    )
  })

  it('speaks Arabic', () => {
    renderForm({}, 'ar')
    expect(screen.getByLabelText('الوزن')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'احفظ واحسب' })).toBeInTheDocument()
    expect(screen.getByText('المجموع: 100%')).toBeInTheDocument()
  })
})
