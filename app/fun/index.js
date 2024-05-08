const { eum, playTpyeOp } = require("../config/index");

exports.getBetMapOrder = (result, playType, mode = "default") => {
  if (playType == eum.TAIWAI_ERBA) {
    //台湾二八数据
    let betMap = playTpyeOp[playType].betMap;
    let {
      randomNumber,
      arrays: { backward },
    } = result;
    console.log("result", result);
    console.log("betMap", betMap);
    let thisBet = betMap[randomNumber];
    console.log("thisBet", thisBet);
    let betOrder = backward?.map((v) => {
      return {
        Bm: 1,
        Ct: v + "",
        Sd: thisBet[v],
      };
    });
    return betOrder;
  }
};
