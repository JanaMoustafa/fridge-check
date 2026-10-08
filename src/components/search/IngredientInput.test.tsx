import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { Tooltip } from 'radix-ui'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import en from '../../../messages/en.json'
import { AnnouncerProvider } from '@/components/providers/Announcer'
import { IngredientLabelsProvider } from '@/components/providers/IngredientLabels'
import { MAX_INGREDIENTS } from '@/types/recipe'
import { IngredientInput, loadEngine, type Chip } from './IngredientInput'

function Harness({ initial = [] as Chip[], onAdd = vi.fn(), onRemove = vi.fn() }) {
  const [chips, setChips] = useState<Chip[]>(initial)
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <IngredientLabelsProvider names={undefined}>
        <AnnouncerProvider>
          <Tooltip.Provider>
            <IngredientInput
              chips={chips}
              onAdd={(added) => {
                onAdd(added)
                setChips((current) => [...current, ...added])
              }}
              onRemove={(canonical) => {
                onRemove(canonical)
                setChips((current) => current.filter((chip) => chip.canonical !== canonical))
              }}
              onClear={() => setChips([])}
            />
          </Tooltip.Provider>
        </AnnouncerProvider>
      </IngredientLabelsProvider>
    </NextIntlClientProvider>
  )
}

const input = () => screen.getByRole('combobox', { name: 'Ingredients you have' })
const chipNames = () =>
  screen.queryByRole('list', { name: 'Your ingredients' })
    ? Array.from(screen.getByRole('list', { name: 'Your ingredients' }).children).map(
        (li) => li.firstChild?.firstChild?.textContent,
      )
    : []

describe('IngredientInput', () => {
  it('adds a typed ingredient on Enter, normalized, remembering what was typed', async () => {
    await loadEngine()
    const onAdd = vi.fn()
    render(<Harness onAdd={onAdd} />)
    await userEvent.type(input(), '2 large ripe tomatoes, diced')
    // The comma submits what was typed before it.
    expect(onAdd).toHaveBeenCalledWith([{ canonical: 'tomato', original: '2 large ripe tomatoes' }])
    await waitFor(() => expect(chipNames()).toEqual(['Tomato']))
  })

  it('suggests as you type and picks with the arrow keys (combobox pattern)', async () => {
    render(<Harness />)
    await userEvent.type(input(), 'aubergi')
    const option = await screen.findByRole('option', { name: 'Eggplant' })
    expect(input()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(input()).toHaveAttribute('aria-activedescendant', option.id)
    expect(option).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(chipNames()).toEqual(['Eggplant']))
    expect(input()).toHaveValue('')
  })

  it('takes the best suggestion for a typo on Enter', async () => {
    render(<Harness />)
    await userEvent.type(input(), 'tomat')
    await screen.findByRole('option', { name: 'Tomato' })
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(chipNames()).toEqual(['Tomato']))
  })

  it('closes the list on Escape, then clears the text on a second Escape', async () => {
    render(<Harness />)
    await userEvent.type(input(), 'garl')
    await screen.findByRole('option', { name: 'Garlic' })
    await userEvent.keyboard('{Escape}')
    expect(input()).toHaveAttribute('aria-expanded', 'false')
    expect(input()).toHaveValue('garl')
    await userEvent.keyboard('{Escape}')
    expect(input()).toHaveValue('')
  })

  it('adds a pasted list (commas, Arabic commas and new lines) in one go', async () => {
    const onAdd = vi.fn()
    render(<Harness onAdd={onAdd} />)
    await userEvent.click(input())
    await userEvent.paste('eggs, onion\nrice، طماطم')
    await waitFor(() => expect(chipNames()).toEqual(['Egg', 'Onion', 'Rice', 'Tomato']))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('refuses duplicates after normalization and says so', async () => {
    render(<Harness initial={[{ canonical: 'tomato' }]} />)
    await userEvent.type(input(), 'Tomatoes,')
    expect(await screen.findByText('Tomato is already in your list.')).toBeInTheDocument()
    expect(chipNames()).toEqual(['Tomato'])
  })

  it('does not make chips from unknown words, and offers suggestions', async () => {
    const onAdd = vi.fn()
    render(<Harness onAdd={onAdd} />)
    await userEvent.type(input(), 'xyzzy plumbus,')
    expect(await screen.findByText(/recognise “xyzzy plumbus”/)).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
    expect(input()).toHaveValue('xyzzy plumbus')
  })

  it('removes the last chip with Backspace on an empty box', async () => {
    const onRemove = vi.fn()
    render(
      <Harness initial={[{ canonical: 'egg' }, { canonical: 'garlic' }]} onRemove={onRemove} />,
    )
    await userEvent.click(input())
    await userEvent.keyboard('{Backspace}')
    expect(onRemove).toHaveBeenCalledWith('garlic')
    expect(chipNames()).toEqual(['Egg'])
  })

  it('removes a chip with its labelled button, and clears all', async () => {
    render(<Harness initial={[{ canonical: 'egg' }, { canonical: 'garlic' }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Egg' }))
    expect(chipNames()).toEqual(['Garlic'])
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(chipNames()).toEqual([])
  })

  it('stops at 20 ingredients with a friendly message', async () => {
    // Loaded up front, as in the other tests: under coverage the lazy load can outlast findBy's wait.
    await loadEngine()
    const initial = Array.from({ length: MAX_INGREDIENTS }, (_, i) => ({ canonical: `item ${i}` }))
    render(<Harness initial={initial} />)
    await userEvent.type(input(), 'egg,')
    expect(
      await screen.findByText(
        `You can add up to ${MAX_INGREDIENTS} ingredients. Remove one to add another.`,
      ),
    ).toBeInTheDocument()
  })

  it('announces additions to screen readers', async () => {
    render(<Harness />)
    await userEvent.type(input(), 'rice,')
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(screen.getByRole('status')).toHaveTextContent('Added Rice.')
  })
})
