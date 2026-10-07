import { describe, expect, it } from 'vitest'
import { splitSentences, splitSteps } from './split-steps'

// Inputs are trimmed copies of real TheMealDB strInstructions (ids in the test names).

describe('splitSteps: lines and markers', () => {
  it('splits on \\r\\n, \\n and \\r and drops blank lines', () => {
    expect(splitSteps('Heat the oil.\r\n\r\nAdd the onion.\nStir.\rServe.')).toEqual([
      'Heat the oil.',
      'Add the onion.',
      'Stir.',
      'Serve.',
    ])
  })

  it('drops "step N" lines in any case (53483)', () => {
    const text =
      'step 1\r\nMake the filling by placing the onion, ginger, garlic, chilli, and some salt ' +
      'into food processor. Purée until smooth.\r\n\r\nstep 2\r\nDrain and rinse the black-eyed ' +
      'peas.\r\n\r\n Step 3\r\nHeat the oven.\r\nSTEP 4\r\nFry the balls.'
    expect(splitSteps(text)).toEqual([
      'Make the filling by placing the onion, ginger, garlic, chilli, and some salt into food ' +
        'processor. Purée until smooth.',
      'Drain and rinse the black-eyed peas.',
      'Heat the oven.',
      'Fry the balls.',
    ])
  })

  it('strips "STEP 1 - TITLE" and "Step 1:" prefixes but keeps the title (52953)', () => {
    expect(
      splitSteps(
        'STEP 1 - SOAK THE RICE NOODLES\r\nSoak the rice noodles overnight\r\n' +
          'STEP 2 -BOIL THE RICE NOODLES\r\nStep 3: Rinse with cold water.',
      ),
    ).toEqual([
      'SOAK THE RICE NOODLES',
      'Soak the rice noodles overnight',
      'BOIL THE RICE NOODLES',
      'Rinse with cold water.',
    ])
  })

  it('strips "1." "1)" "01." and tab-separated numbers (52992, 52802, 53068)', () => {
    expect(
      splitSteps(
        '1. Preheat oven to 425 degrees.\r\n\r\n2) Wash and dry all produce.\r\n' +
          '01.Put the potatoes in a pan.\r\n4.\tShare and enjoy!\r\n12. Serve.',
      ),
    ).toEqual([
      'Preheat oven to 425 degrees.',
      'Wash and dry all produce.',
      'Put the potatoes in a pan.',
      'Share and enjoy!',
      'Serve.',
    ])
  })

  it('keeps a leading decimal or fraction, which is an amount, not a step number', () => {
    expect(splitSteps('1.5 kg lamb, cubed\r\n1/2 green pepper, chopped')).toEqual([
      '1.5 kg lamb, cubed',
      '1/2 green pepper, chopped',
    ])
  })

  it('drops "▢" bullet lines (53126)', () => {
    expect(
      splitSteps(
        '▢\r\nHeat olive oil in a large pot.\r\n▢\r\nDice the onion and add to browning beef.\r\n' +
          '▢\r\nTop with fresh parsley.',
      ),
    ).toEqual([
      'Heat olive oil in a large pot.',
      'Dice the onion and add to browning beef.',
      'Top with fresh parsley.',
    ])
  })

  it('strips inline bullets • - * (53374)', () => {
    expect(
      splitSteps('• Rinse the rice.\r\n- Soak it.\r\n*A lot of grocery stores sell it.'),
    ).toEqual(['Rinse the rice.', 'Soak it.', 'A lot of grocery stores sell it.'])
  })

  it('drops numbering-only lines and keeps the title lines under them (53406)', () => {
    const text =
      '1\r\nPrepare the Figs\r\nCut off the hard bits of stalk.\r\n2\r\nPlace the figs in a ' +
      'small frying pan.\r\n3\r\nCooking\r\nLeave the figs on a medium heat.'
    expect(splitSteps(text)).toEqual([
      'Prepare the Figs',
      'Cut off the hard bits of stalk.',
      'Place the figs in a small frying pan.',
      'Cooking',
      'Leave the figs on a medium heat.',
    ])
  })

  it('strips bare step numbers that count 1, 2, 3 … (53014)', () => {
    expect(
      splitSteps(
        '1 Preheat the oven to 230°C.\r\n2 Add the sugar to warm water.\r\n' +
          'Leave it for 10 minutes.\r\n3 Sift the flour.',
      ),
    ).toEqual([
      'Preheat the oven to 230°C.',
      'Add the sugar to warm water.',
      'Leave it for 10 minutes.',
      'Sift the flour.',
    ])
  })

  it('keeps bare numbers that are amounts in ingredient lines (53440, 52784)', () => {
    expect(
      splitSteps(
        'Place in a blender:\r\n1 tomato, peeled and chopped\r\n1 medium onion, peeled\r\n' +
          '2 Cups Raw Unsalted Cashews',
      ),
    ).toEqual([
      'Place in a blender:',
      '1 tomato, peeled and chopped',
      '1 medium onion, peeled',
      '2 Cups Raw Unsalted Cashews',
    ])
  })
})

describe('splitSteps: headers', () => {
  it('keeps a header as its own step when content follows (53138)', () => {
    expect(
      splitSteps(
        'Assemble: Spread dulce de leche on one cookie.\r\nPro Tips:\r\n\r\n' +
          'Chill the dough before rolling it out.\r\nDip the alfajores in chocolate.',
      ),
    ).toEqual([
      'Assemble: Spread dulce de leche on one cookie.',
      'Pro Tips:',
      'Chill the dough before rolling it out.',
      'Dip the alfajores in chocolate.',
    ])
  })

  it('drops a trailing header and a header followed by another header', () => {
    expect(
      splitSteps('Filling:\r\nFor the sauce:\r\nMix the sauce.\r\nServe.\r\nPro Tips:\r\n'),
    ).toEqual(['For the sauce:', 'Mix the sauce.', 'Serve.'])
  })

  it('drops generic labels the page already shows (53353, 52949, DIRECTIONS:)', () => {
    expect(
      splitSteps(
        'Instructions\r\n \r\nBring water to a boil.\r\nCooking Instructions\r\n' +
          '1. Heat the wok.\r\nDIRECTIONS:\r\nMethod\r\nServe.',
      ),
    ).toEqual(['Bring water to a boil.', 'Heat the wok.', 'Serve.'])
  })

  it('returns no steps when there is only a header or nothing at all', () => {
    expect(splitSteps('')).toEqual([])
    expect(splitSteps(' \r\n\r\n ')).toEqual([])
    expect(splitSteps('Pro Tips:')).toEqual([])
    expect(splitSteps('Instructions\r\n▢\r\n1.')).toEqual([])
  })
})

describe('splitSteps: text repair', () => {
  it('collapses whitespace, tabs and no-break spaces', () => {
    expect(splitSteps('Add  the dry ingredients\tand stir,\u00A0 Add berries.\r\nBake.')).toEqual([
      'Add the dry ingredients and stir, Add berries.',
      'Bake.',
    ])
  })

  it('drops zero-width and soft-hyphen characters and lines made only of them', () => {
    expect(splitSteps('\u200B\r\nStir the s\u00ADauce.\uFEFF\r\n\u200B\r\nServe.')).toEqual([
      'Stir the sauce.',
      'Serve.',
    ])
  })

  it('adds a missing space after a sentence before a capital (53099, 53489)', () => {
    expect(
      splitSteps(
        'Season with black pepper.Work with wet hands.\r\n' +
          'Add carrots (optional).Add salt!Then stir.',
      ),
    ).toEqual([
      'Season with black pepper. Work with wet hands.',
      'Add carrots (optional). Add salt! Then stir.',
    ])
  })

  it('leaves decimals, initials and lowercase continuations alone', () => {
    expect(splitSteps('Add 1.5 kg of U.S.A beef, e.g.brisket.\r\nCook 2.5 hours.cover.')).toEqual([
      'Add 1.5 kg of U.S.A beef, e.g.brisket.',
      'Cook 2.5 hours.cover.',
    ])
  })

  it('rejoins long lines the source hard-wrapped mid-sentence (52807)', () => {
    const text =
      'Rinse the baingan (eggplant or aubergine) in water. Pat dry with a kitchen napkin. Apply ' +
      'some oil all over and\r\nkeep it for roasting on an open flame.\r\n2. Roast the aubergine ' +
      'till its completely cooked and tender. Remove the baingan and immerse in water till it ' +
      'cools\r\ndown.\r\n3. Use natural charcoal.'
    expect(splitSteps(text)).toEqual([
      'Rinse the baingan (eggplant or aubergine) in water. Pat dry with a kitchen napkin. Apply ' +
        'some oil all over and keep it for roasting on an open flame.',
      'Roast the aubergine till its completely cooked and tender. Remove the baingan and ' +
        'immerse in water till it cools down.',
      'Use natural charcoal.',
    ])
  })

  it('rejoins a hard wrap across a blank line (53005)', () => {
    const text =
      'Pie Crust: In a food processor, place the flour, salt, and sugar and process until ' +
      'combined. Add the butter and process until the mixture resembles coarse\r\n\r\nmeal ' +
      '(about 15 seconds).\r\nTurn the dough onto your work surface.'
    expect(splitSteps(text)).toEqual([
      'Pie Crust: In a food processor, place the flour, salt, and sugar and process until ' +
        'combined. Add the butter and process until the mixture resembles coarse meal (about ' +
        '15 seconds).',
      'Turn the dough onto your work surface.',
    ])
  })

  it('keeps short unpunctuated steps apart even before a lowercase line (53578)', () => {
    expect(
      splitSteps(
        'beat egg and sugar into a light foam\r\nsift together flour and spice.\r\n' +
          'Add milk and beer while stirring\r\nadd melted butter\r\nLet set and bake waffles',
      ),
    ).toEqual([
      'beat egg and sugar into a light foam',
      'sift together flour and spice.',
      'Add milk and beer while stirring',
      'add melted butter',
      'Let set and bake waffles',
    ])
  })

  it('does not glue a numbered or bulleted line onto a long unfinished one', () => {
    const long = 'Bring the stock to a simmer and keep it warm on the back of the stove while you'
    const longer = `${long} prepare everything else that the recipe needs and`
    expect(splitSteps(`${longer}\r\n▢\r\nmeanwhile chop the onion.`)).toEqual([
      longer,
      'meanwhile chop the onion.',
    ])
    expect(splitSteps(`${longer}\r\n2. meanwhile chop the onion.`)).toEqual([
      longer,
      'meanwhile chop the onion.',
    ])
  })
})

describe('splitSteps: one-paragraph recipes', () => {
  it('splits a paragraph into steps of up to 3 sentences, as even as possible (53060)', () => {
    const text =
      'Fry the onions and meat in oil. Add the salt and pepper. Grease a round baking tray and ' +
      'put a layer of pastry in it. Cover with a thin layer of filling. Put another layer of ' +
      'filling and cover with pastry. When you have five or six layers, bake at 200ºC/392ºF for ' +
      'half an hour and cut in quarters and serve.'
    expect(splitSteps(text)).toEqual([
      'Fry the onions and meat in oil. Add the salt and pepper. Grease a round baking tray and ' +
        'put a layer of pastry in it.',
      'Cover with a thin layer of filling. Put another layer of filling and cover with pastry. ' +
        'When you have five or six layers, bake at 200ºC/392ºF for half an hour and cut in ' +
        'quarters and serve.',
    ])
  })

  it('makes two steps from two sentences (53061)', () => {
    expect(
      splitSteps(
        'Wash the fish under the cold tap. Roll in the flour and deep fry in oil until crispy. ' +
          'Lay on kitchen towel and serve hot.',
      ),
    ).toEqual([
      'Wash the fish under the cold tap. Roll in the flour and deep fry in oil until crispy.',
      'Lay on kitchen towel and serve hot.',
    ])
    expect(splitSteps('Mix everything. Serve.')).toEqual(['Mix everything.', 'Serve.'])
  })

  it('gives 7 sentences as 3 + 2 + 2 and loses no text', () => {
    const sentences = ['One.', 'Two!', 'Three?', 'Four.', 'Five.', 'Six.', 'Seven.']
    const steps = splitSteps(sentences.join('  '))
    expect(steps).toEqual(['One. Two! Three?', 'Four. Five.', 'Six. Seven.'])
    expect(steps.join(' ')).toBe(sentences.join(' '))
  })

  it('keeps a single sentence as one step (53076)', () => {
    expect(splitSteps('Make and enjoy')).toEqual(['Make and enjoy'])
  })

  it('splits the one paragraph under a header and keeps the header (52820)', () => {
    expect(splitSteps('Instructions:\r\nFor the sauce:\r\nMix the paste. Add water.')).toEqual([
      'For the sauce:',
      'Mix the paste.',
      'Add water.',
    ])
  })

  it('leaves multi-paragraph recipes paragraph by paragraph', () => {
    expect(splitSteps('Chop it. Fry it.\r\nServe it. Eat it.')).toEqual([
      'Chop it. Fry it.',
      'Serve it. Eat it.',
    ])
  })
})

describe('splitSentences', () => {
  it('splits at . ! ? before a capital and keeps closing quotes with the sentence (53352)', () => {
    expect(splitSentences('Set Instant Pot to "Sauté." Once hot, add oil! Ready? Go.')).toEqual([
      'Set Instant Pot to "Sauté."',
      'Once hot, add oil!',
      'Ready?',
      'Go.',
    ])
  })

  it('does not split decimals or before a lowercase word (53450)', () => {
    expect(splitSentences('Add 1.5 cups. Reduce heat and cover. occasionally stirring.')).toEqual([
      'Add 1.5 cups.',
      'Reduce heat and cover. occasionally stirring.',
    ])
  })

  it('does not split after abbreviations', () => {
    expect(
      splitSentences('Use 1 tbsp. Olive oil, approx. Two cups, e.g. Maldon salt, i.e. Flaky.'),
    ).toEqual(['Use 1 tbsp. Olive oil, approx. Two cups, e.g. Maldon salt, i.e. Flaky.'])
  })

  it('keeps "°C." with a bracketed conversion but ends a sentence before a capital (53380)', () => {
    expect(
      splitSentences('Preheat the oven to 180°C. (350˚F) Grease a pan. Heat to 200°C. Bake it.'),
    ).toEqual(['Preheat the oven to 180°C. (350˚F) Grease a pan.', 'Heat to 200°C.', 'Bake it.'])
  })

  it('splits before a quoted capital and after an ellipsis', () => {
    expect(splitSentences('Stir well... "Taste" it now. Done')).toEqual([
      'Stir well...',
      '"Taste" it now.',
      'Done',
    ])
  })

  it('returns the whole text when there is no boundary', () => {
    expect(splitSentences('Simply combine everything in a bowl')).toEqual([
      'Simply combine everything in a bowl',
    ])
  })
})

describe('splitSteps: invariants', () => {
  const samples = [
    'step 1\r\nHeat.\r\n\r\nstep 2\r\nServe.',
    '▢\r\n▢\r\n  Mix   well .  \r\n',
    'Pro Tips:\r\n\r\n',
    'A. B. C. D. E. F. G. H. I. J.',
    '1\r\n2\r\n3',
    'Nutrition Facts\r\n1 sandwich: 445 calories, 24g fat.',
  ]

  it.each(samples)('returns trimmed, non-empty, single-spaced steps for %j', (sample) => {
    for (const step of splitSteps(sample)) {
      expect(step).not.toBe('')
      expect(step).toBe(step.trim())
      expect(step).not.toMatch(/\s{2}/)
    }
  })
})
