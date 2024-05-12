const { eum, playTpyeOp } = require("../config/index");

exports.getBetMapOrder = (result) => {
  let { amt, playType, randomNumber, list } = result;
  if (playType == eum.TAIWAI_ERBA) {
    //台湾二八数据
    let betMap = playTpyeOp[playType].betMap;
    let thisBet = betMap[randomNumber];
    let betOrder = list?.map((v) => {
      return {
        Bm: amt,
        Ct: v + "",
        Sd: thisBet[v],
      };
    });
    return betOrder;
  }
};
