var content = [
  {
    value: 'Sex/Nudity',
    title: 'Sex/Nudity',
    description: '',
    color: 'green',
    severity_title: 'aa',
    types_title: 'aa',
    severity: [
      {
        value: 'Non erotic',
        title: 'Non erotic',
        description: "Nudity with no erotic purpose, eg: Michelangelo's David, human corpse..."
      },
      {
        value: 'Slightly erotic',
        title: 'Slightly erotic',
        description:
          'Slightly erotic or graphic scene, eg: brief kiss, revealing outfit, mild sexual reference...'
      },
      {
        value: 'Moderately erotic',
        title: 'Moderately erotic',
        description:
          'Moderately erotic or graphic scene, eg: passionate kissing, provocative dancing, graphic sexual remarks...'
      },
      {
        value: 'Very erotic',
        title: 'Very erotic',
        description: 'Very erotic or graphic scene, eg: sex, foreplay, moaning...'
      }
    ],
    types: [
      {
        value: 'No consent',
        title: 'No consent',
        description: 'Lack or inability to consent, eg: rape, child molestation, harassment...'
      },
      {
        value: 'Unloving/objectifying',
        title: 'Unloving/objectifying',
        description:
          'Limited intention to bond, care or look after the other, eg: one night stand, prostitution, striptease...'
      },
      {
        value: 'Non-procreative',
        title: 'Non-procreative',
        description:
          'Sexual intercourse outside a procreative context, eg: oral sex, anal sex, masturbation, explicit use of contraception...'
      },
      {
        value: 'Infidelity',
        title: 'Infidelity',
        description: 'Unfaithfulness to a partner, eg: adultery...'
      }
    ]
  },
  {
    value: 'Violence',
    title: 'Violence/Gore',
    description: '',
    color: 'red',
    severity_title: 'vv',
    types_title: 'vv',
    severity: [
      {
        value: 'Non gore',
        title: 'Non gore',
        description: 'Violence is implied but nothing is shown'
      },
      {
        value: 'Slightly gore',
        title: 'Slightly gore',
        description: 'Slightly gore or graphical scene, eg: mild verbal violence, punching'
      },
      {
        value: 'Moderately gore',
        title: 'Moderately gore',
        description: 'Moderately gore or graphical scene, eg: extensive bleeding, broken bones...'
      },
      {
        value: 'Very gore',
        title: 'Very gore',
        description: 'Very gore or graphical scene, eg: blood splattered, open wounds, guts...'
      }
    ],
    types: [
      {
        value: 'Discrimination',
        title: 'Discrimination',
        description: 'Verbal of physical violence due to race, sex, religion, disability...'
      },
      {
        value: 'Cruelty',
        title: 'Cruelty',
        description: 'One of the parties is significantly weaker or have no chance of winning'
      },
      {
        value: 'Self harm',
        title: 'Self harm',
        description: 'Self inflicted pain or damage, eg: suicide...'
      }
    ]
  },
  {
    value: 'Other',
    title: 'Other',
    description: '',
    color: 'blue',
    severity_title: '',
    types_title: '',
    severity: [],
    types: [
      {
        value: 'Mild profanity',
        title: 'Mild profanity',
        description: 'Mild language, eg: h*ll, d*mn...'
      },
      {
        value: 'Strong profanity',
        title: 'Strong profanity',
        description: 'Swear words'
      },
      {
        value: 'Blasphemy',
        title: 'Blasphemy',
        description: 'Speaking sacrilegiously about God or sacred things'
      },
      {
        value: 'Legal drugs',
        title: 'Legal drugs',
        description: 'Consumption of legal drugs, eg: alcohol, tobacco...'
      },
      {
        value: 'Illegal drugs',
        title: 'Illegal drugs',
        description: 'Consumption or dealing of illegal drugs, eg: weed, cocaine...'
      }
    ]
  }
]

var actions = {
  types_title: 'What to do?',
  types: [
    { value: 'Sound only', title: 'Sound only', description: 'Tags apply only to sound' },
    { value: 'Video only', title: 'Video only', description: 'Tags apply only to video.' },
    {
      value: 'Local',
      title: 'Local',
      description: 'Store only on your computer. Do not share it with others.'
    },
    {
      value: 'Mild plot',
      title: 'Mild plot',
      description: 'This scene is slightly important for the plot.'
    },
    {
      value: 'Strong plot',
      title: 'Strong plot',
      description: 'This scene is very important for the plot.'
    }
  ]
}

module.exports = {
  content,
  actions
}
