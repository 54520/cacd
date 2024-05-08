"use strict";

const { Service } = require("egg");
const { generateRandomArrays, getBetMapOrder } = require("../utils/index");

class ScheduleService extends Service {
  /**
   * 测试处理程序
   * @param {*} params 任务参数
   * @param {*} jobHandlerLog 日志
   */
  async testHandler(params, jobHandlerLog) {
    // 此处替换成具体业务代码
    await this.logger.info("我是测试任务，任务参数: %s", params);
    await jobHandlerLog.log("我是测试任务，任务参数: {0}", params);
  }
  /**
   * 测试调用接口任务
   * @param {*} params 任务参数
   * @param {*} jobHandlerLog 日志
   */
  async testCurlHandler(params, jobHandlerLog) {
    // 获取参数
    const paramsObj = JSON.parse(params);
    const result = await this.ctx.curl(paramsObj.url, {
      method: paramsObj.method,
      data: paramsObj.data,
      dataType: "json",
    });
    await jobHandlerLog.log("测试调用接口任务，状态码：{0}", result.status);
    await jobHandlerLog.log(
      "测试调用接口任务，响应数据：{0}",
      JSON.stringify(result.data)
    );
  }

  /**
   *
   * @param {*} params 任务参数
   * @param {*} jobHandlerLog 日志
   */
  async TAIWAI_ERBA_HANDLER(params, jobHandlerLog) {
    //查询彩种配置
    let playConfig = await this.app.mysql.get("lotterysettings", {
      lottery_id: params.playType,
    });
    if (!playConfig) return await jobHandlerLog.log("未查询到彩种配置");
    playConfig = JSON.parse(JSON.stringify(playConfig));
    console.log("playConfig", playConfig);
    // 此处替换成具体业务代码
    console.log("jobHandlerLog", jobHandlerLog);
    let aaa = await this.service.api.getToken()
    console.log('aaa',aaa);
    console.log('11111');
    // let arr = generateRandomArrays({
    //   numStart: 9,
    //   numEnd: 18,
    //   start: 1,
    //   end: 3,
    // });
    // let betRes = getBetMapOrder({
    //   result: { ...arr, randomNumber: 0 },
    //   playType: params.playType,
    //   amt: 2,
    // });
    // const { data } = await this.ctx.curl(
    //   "https://wg.nteqdd.com/zh-cn/Period/Period/GetPeriodInfo",
    //   {
    //     method: "GET",
    //     headers: {
    //       Authorization:
    //         "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkVFRkE5QzNGNDEwREZGOTk5QUYwQzFERTZENEQwNDg2MTRGMUE2NkUiLCJ0eXAiOiJKV1QiLCJ4NXQiOiI3dnFjUDBFTl81bWE4TUhlYlUwRWhoVHhwbTQifQ.eyJuYmYiOjE3MTUxNzY1ODUsImV4cCI6MTcxNTI2Mjk4NSwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDAxIiwiYXVkIjpbImh0dHA6Ly9sb2NhbGhvc3Q6ODAwMS9yZXNvdXJjZXMiLCJhcGlzIl0sImNsaWVudF9pZCI6ImNpZF9hcGlzIiwic3ViIjoiMTEzMTE0NCIsImF1dGhfdGltZSI6MTcxNTE3NjU4NSwiaWRwIjoibG9jYWwiLCJpc3Rlc3QiOiJGYWxzZSIsInBsYXRmb3JtaWQiOiIxNyIsInVzZXJ0eXBlIjoiMCIsImNsaWVudHR5cGUiOiIwIiwic2NvcGUiOlsiYXBpcyJdLCJhbXIiOlsicGFzc3dvcmQiXX0.MBPuhwDW_Uce7c62h4cXgN_MoEfrfYuIfeao7_b2dYHdpsAsEsm1OfhyvtcXLAT-Ed7j1Z8tDyF1sXuFFhHo2-BRiuK1o2jVYNrkMw6wEW42pRUhsFI2iWLD4BN5RKxHxJ17ompYoEwZVOr9AN0Yp_DkRPtlfsx-P8H7bX36mSGjVp-_uOiiO927B1ATBwcnw2PR-F5w1-sDFuadRa1F9t4VVfGBQu-IPPAOlVNy84MnGslmz1LnyNcM8zEvWE_kwrOK_mxlVkzu_P2ppHu9oZgiszrgUfi45OckihVv0n-sqXsSvTyhuksfmsJQeJen1edWltisHcgQj_b-lRE04Q",
    //     },
    //     data: {
    //       lid: params.playType,
    //     },
    //     dataType: "json",
    //   }
    // );
    // console.log("datadatadatadata", data);
    // console.log("betRes", betRes);
    // let ps = {
    //   lid: params.playType,
    //   QiShu: data?.Result?.QiShu,
    //   Orders: betRes,
    // };
    // console.log("ps", ps);
    // const BetRes = await this.ctx.curl(
    //   "https://wg.nteqdd.com/zh-cn/OddsLimit/Lotto/Bet",
    //   {
    //     method: "POST",
    //     rejectUnauthorized: false, //是否校验证书
    //     headers: {
    //       Accept: "*/*",
    //       "Content-Type": "application/json",
    //       Authorization:
    //         "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkVFRkE5QzNGNDEwREZGOTk5QUYwQzFERTZENEQwNDg2MTRGMUE2NkUiLCJ0eXAiOiJKV1QiLCJ4NXQiOiI3dnFjUDBFTl81bWE4TUhlYlUwRWhoVHhwbTQifQ.eyJuYmYiOjE3MTQ5OTU4NTcsImV4cCI6MTcxNTA4MjI1NywiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDAxIiwiYXVkIjpbImh0dHA6Ly9sb2NhbGhvc3Q6ODAwMS9yZXNvdXJjZXMiLCJhcGlzIl0sImNsaWVudF9pZCI6ImNpZF9hcGlzIiwic3ViIjoiMTEzMTE0NCIsImF1dGhfdGltZSI6MTcxNDk5NTg1NywiaWRwIjoibG9jYWwiLCJpc3Rlc3QiOiJGYWxzZSIsInBsYXRmb3JtaWQiOiIxNyIsInVzZXJ0eXBlIjoiMCIsImNsaWVudHR5cGUiOiIwIiwic2NvcGUiOlsiYXBpcyJdLCJhbXIiOlsicGFzc3dvcmQiXX0.VZH6PtlX-BLuE5V5vG7y701vE_UMGsIW1mSB18iE3LfjeppUi0QwiMushJX2bgAQDat6RvQZtSXzswZcKsQMawYUiMKpr7cXXHtQaW7Ts9UJMMyQwAZzw1N_RGL5csXX2ZRPLVx8nGnUhjAZq3pum3dTYDvBIkYCevvA1bzY7ml7FO4ooCVyPD7dm0no59hsFU9iKJRLJ_lmFhJMDCnGIyev77k_kbtCaZmwTXcxDM3NDNVyRSABJhSW1oKD3YyJ6-wWsPubtwD2o6vnQ1Oz7NYW9z_5Uz1q7aMHGq0nsg3tAQRiChwYrPJ9qwVOx-nMoXRSShecZp_JwGIDiMRErQ",
    //     },
    //     data: ps,
    //     dataType: "json",
    //   }
    // );
    // console.log("BetRes", BetRes);
    // await this.logger.info("111111", params);
    // await this.logger.info(
    //   "111111",
    //   generateRandomArrays({
    //     numStart: 9,
    //     numEnd: 18,
    //     start: 1,
    //     end: 3,
    //   })
    // );
  }
}

module.exports = ScheduleService;
