const eum = {
  TAIWAI_ERBA: 20, //台湾二八
  JISHU_KUAI_SAN: 23, //极速快三
  TAIWAN_BINGO: 91, //台湾宾果
};

const playTpyeOp = {
  [eum.TAIWAN_BINGO]: {
    label: "台湾宾果",
  },
  [eum.JISHU_KUAI_SAN]: {
    label: "极速快三",
  },
  [eum.TAIWAI_ERBA]: {
    label: "台湾28",
    betMap: {
      //映射下注id
      1: {
        0: 1,
        1: 2,
        2: 3,
        3: 4,
        4: 5,
        5: 6,
        6: 7,
        7: 8,
        8: 9,
        9: 10,
      },
      2: {
        0: 15,
        1: 16,
        2: 17,
        3: 18,
        4: 19,
        5: 20,
        6: 21,
        7: 22,
        8: 23,
        9: 24,
      },
      3: {
        0: 29,
        1: 30,
        2: 31,
        3: 32,
        4: 33,
        5: 34,
        6: 35,
        7: 36,
        8: 37,
        9: 38,
      },
      0:{
        9: 52,
        10: 53,
        11: 54,
        12: 55,
        13: 56,
        14: 57,
        15: 58,
        16: 59,
        17: 60,
        18: 61,
      }
    },
  },
};

module.exports = {
    eum,
    playTpyeOp,
}