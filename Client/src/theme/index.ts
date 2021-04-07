

const common = {
  color: {
    bgBasePrimary: '#141618',
    bgBaseSecondary: '#202226',
    bgElevatedSecondary: '#282a2e',
    blue: '#3782ff',
    fillDarkPrimary: 'rgba(44, 44, 48, 0.8)',
    fillDarkQuarternary: 'rgba(236, 236, 248, 0.3)',
    fillDarkSecondary: 'rgba(44, 44, 48, 0.65)',
    fillDarkTertiary: 'rgba(118, 118, 124, 0.3)',
    green: '#14be6e',
    kasaBlue: '#0f87ff',
    red: '#fd463c',
    separatorDarkPrimary: '#2c2e30',
    separatorDarkSecondary: 'rgba(20, 22, 24, 0.6)',
    separatorDarkTertiary: 'rgba(100, 100, 104, 0.7)',
    textDarkQuarternary: 'rgba(236, 236, 248, 0.35)',
    textDarkSecondary: 'rgba(236, 236, 248, 0.7)',
    textDarkTeritary: 'rgba(236, 236, 248, 0.5)',
    white: '#fff'
  }
}

const theme = {
  background: {
    color: common.color.bgBasePrimary,
    text: common.color.white
  },
  common,
  header: {
    title: {
      color: '#fff'
    }
  }
};

export default theme;

/*
- WIP: Add theme key amount testing
Dark and light themes should contain equal amount of keys
*/
