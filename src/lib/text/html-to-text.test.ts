import { describe, expect, it } from 'vitest'
import { htmlToText } from './html-to-text'

describe('htmlToText', () => {
  it('puts each block on its own line', () => {
    expect(htmlToText('<ol><li>Boil the pasta.</li><li>Drain it.</li></ol>')).toBe(
      'Boil the pasta.\nDrain it.',
    )
    expect(htmlToText('<p>One</p><p>Two<br/>Three</p>')).toBe('One\nTwo\nThree')
  })

  it('keeps inline text together and drops tags, comments, scripts and styles', () => {
    expect(
      htmlToText(
        'Add <b>2 cups</b> of <a href="x">rice</a><!-- note --><script>alert(1)</script><style>p{}</style>.',
      ),
    ).toBe('Add 2 cups of rice.')
  })

  it('decodes named and numeric entities', () => {
    expect(
      htmlToText('Salt &amp; pepper&nbsp;&ndash; 1&frac12; tsp &#8211; 180&#xB0;C &lt;b&gt;'),
    ).toBe('Salt & pepper – 1½ tsp – 180°C <b>')
  })

  it('leaves unknown or invalid entities as written', () => {
    expect(htmlToText('&bogus; &#0; &#x110000;')).toBe('&bogus; &#0; &#x110000;')
  })

  it('collapses whitespace and drops empty lines', () => {
    expect(htmlToText('  <div>\n  Stir   well \t</div>\n\n<div> </div>')).toBe('Stir well')
    expect(htmlToText('')).toBe('')
  })
})
