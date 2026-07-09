export const QUICK_PLAY_CONFIG = {
  eventCount: { min: 3, max: 4 },

  eventTypeWeights: {
    FREE_KICK: 0.7,
    PENALTY: 0.3,
  },

  guaranteePenaltyOnMaxEvents: true,

  clockAnimationDuration: 1.2,

  clockHoldDuration: 2.0,

  halftimeHoldDuration: 2.5,

  fulltimeHoldDuration: 3.0,

  goalFlashDuration: 1.5,

  flavorLines: {
    FREE_KICK: [
      'Foul on the edge of the box',
      'Dangerous free kick opportunity',
      'Wall is set — can he curl it over?',
      'Free kick after a late challenge',
      'Set piece specialist steps up',
    ],
    PENALTY: [
      'Handball in the box!',
      'Penalty after a reckless tackle',
      'Spot kick awarded!',
      'The referee points to the spot',
      'Controversial penalty decision!',
    ],
  },
};
