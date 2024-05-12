"use strict";

const { Service } = require("egg");
const { generateRandomArrays, getBetMapOrder } = require("../utils/index");
const dayjs = require("dayjs");
const CONSTANTS = require("../constants/index");

let MapList = {
  1: "forward",
  2: "backward",
};

class ScheduleService extends Service {
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
    await this.service.api.getToken();
    //查询下单日志表
    let orderLog = await this.app.mysql.select("order", {
      where: {
        lottery_id: params.playType,
      },
    });
    //查询当前期数信息
    let periodInfo = await this.service.api.GetPeriodInfo({
      lid: params.playType,
    });
    //查询期间的开奖结果
    let { Result } = await this.service.api.GetLotteryResult({
      lid: params.playType,
      count: 20,
    });
    let { ToStop, QiShu } = periodInfo?.Result;
    console.log("periodInfo", periodInfo);
    //判断在日志表中是否能找到当前期数的下单信息
    let findOrder = orderLog.find(
      (item) =>
        (item.qishu == periodInfo?.Result?.QiShu ||
          item.qishu == periodInfo?.Result?.PreQiShu) &&
        item.order_status == 2
    );
    console.log("findOrder", findOrder);
    if (findOrder) {
      let thisNotStlRes = Result?.find((v) => v.QiShu == findOrder.qishu);
      console.log("thisNotStlRes", thisNotStlRes);
      if (thisNotStlRes) {
        let isWin = findOrder?.place_order_num
          ?.split(",")
          .includes(thisNotStlRes?.Details.Sum);
        if (isWin) {
          //如果中奖则更新配置表的状态
          await this.service.api.resDbClose(params.playType);

          let order = await this.app.mysql.update("order", {
            id: findOrder.id,
            order_status: 1,
            lottery_num: thisNotStlRes?.Details.Sum,
            remark: "已中奖",
          });
          if (order?.affectedRows == 1) {
            console.log("订单表更新成功");
            //继续下单
            let { arrays } = generateRandomArrays({
              numStart: playConfig.num_start,
              numEnd: playConfig.num_end,
            });
            let betRes = getBetMapOrder({
              list: arrays[MapList[playConfig.is_direction]],
              playType: params.playType,
              randomNumber: 0,
              amt: playConfig.bet_amount,
            });
            let numStr = betRes.map((v) => v.Ct).join(",");
            console.log("betRes", betRes);
            console.log("numStr", numStr);
            let ps = {
              lid: params.playType,
              QiShu: QiShu,
              Orders: betRes,
            };
            console.log("ps", ps);
            //下单
            let { Code, Message } = await this.service.api.Bet(ps);
            return await this.app.mysql.insert("order", {
              lottery_id: params.playType,
              qishu: QiShu,
              one_amt: playConfig.bet_amount,
              order_status:
                Code != 10000
                  ? CONSTANTS.ORDER_STATUS.EXPIRED
                  : CONSTANTS.ORDER_STATUS.NOT_OPEN,
              place_order_num: numStr,
              create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              remark: Code != 10000 ? Message : "下单成功",
            });
          }
        } else {
          let order = await this.app.mysql.update("order", {
            id: findOrder.id,
            order_status: 0,
            lottery_num: thisNotStlRes?.Details.Sum,
            remark: "未中奖",
          });
          if (order?.affectedRows == 1) {
            console.log("订单表更新成功");
            let db_amt = playConfig.db_amt + 1;
            let db_it_time = playConfig.db_it_time + 1;
            //判断是否超过最大倍投次数
            if (db_it_time > playConfig.max_db_it_time) {
              let lotterysettings = await this.service.api.resDbClose(
                params.playType
              );
              if (lotterysettings?.affectedRows == 1) {
                console.log("配置表更新成功");
                let order = await this.app.mysql.update("order", {
                  id: findOrder.id,
                  order_status: 3,
                  remark: "已达到最大倍投次数",
                });
                if (order?.affectedRows == 1) {
                  console.log("订单表更新成功");
                  //重新生成数据下单
                  let { arrays } = generateRandomArrays({
                    numStart: playConfig.num_start,
                    numEnd: playConfig.num_end,
                  });
                  let betRes = getBetMapOrder({
                    list: arrays[MapList[playConfig.is_direction]],
                    playType: params.playType,
                    randomNumber: 0,
                    amt: playConfig.bet_amount,
                  });
                  let numStr = betRes.map((v) => v.Ct).join(",");
                  console.log("betRes", betRes);
                  console.log("numStr", numStr);
                  let ps = {
                    lid: params.playType,
                    QiShu: QiShu,
                    Orders: betRes,
                  };
                  console.log("ps", ps);
                  //下单
                  let { Code, Message } = await this.service.api.Bet(ps);
                  return await this.app.mysql.insert("order", {
                    lottery_id: params.playType,
                    qishu: QiShu,
                    one_amt: playConfig.bet_amount,
                    order_status:
                      Code != 10000
                        ? CONSTANTS.ORDER_STATUS.EXPIRED
                        : CONSTANTS.ORDER_STATUS.NOT_OPEN,
                    place_order_num: numStr,
                    create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    remark: Code != 10000 ? Message : "下单成功",
                  });
                }
              }
            } else {
              //查询当前期是否已经下单了
              let isExistOrder = await this.app.mysql.get("order", {
                lottery_id: params.playType,
                qishu: QiShu,
              });
              if (isExistOrder) return;
              //更新配置表的倍投信息
              let lotterysettings = await this.app.mysql.update(
                "lotterysettings",
                {
                  is_db_investment: 1, //开启倍投
                  db_amt, //倍投金额
                  db_it_time, //倍投次数
                },
                {
                  where: {
                    lottery_id: params.playType,
                  },
                }
              );
              console.log("lotterysettings", lotterysettings);
              if (lotterysettings?.affectedRows == 1) {
                // console.log("配置表更新成功");
                // //拿着上期的下单信息进行倍投
                // let { place_order_num } = findOrder;
                // let list = place_order_num.split(",");
                // let betRes = getBetMapOrder({
                //   list: list,
                //   playType: params.playType,
                //   randomNumber: 0,
                //   amt: db_amt,
                // });
                // let numStr = betRes.map((v) => v.Ct).join(",");
                // console.log("betRes", betRes);
                // console.log("numStr", numStr);
                // let ps = {
                //   lid: params.playType,
                //   QiShu: QiShu,
                //   Orders: betRes,
                // };
                // console.log("ps", ps);
                let { arrays } = generateRandomArrays({
                  numStart: playConfig.num_start,
                  numEnd: playConfig.num_end,
                });
                let betRes = getBetMapOrder({
                  list: arrays[MapList[playConfig.is_direction]],
                  playType: params.playType,
                  randomNumber: 0,
                  amt: db_amt,
                });
                let numStr = betRes.map((v) => v.Ct).join(",");
                let ps = {
                  lid: params.playType,
                  QiShu: QiShu,
                  Orders: betRes,
                };
                //下单
                let { Code, Message } = await this.service.api.Bet(ps);
                return await this.app.mysql.insert("order", {
                  lottery_id: params.playType,
                  qishu: QiShu,
                  one_amt: db_amt,
                  order_status:
                    Code != 10000
                      ? CONSTANTS.ORDER_STATUS.EXPIRED
                      : CONSTANTS.ORDER_STATUS.NOT_OPEN,
                  place_order_num: numStr,
                  create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                  remark: Code != 10000 ? Message : "倍投下单成功",
                });
              }
            }
          }
        }
      }
    } else {
      if (ToStop <= 20)
        return await this.app.mysql.insert("order", {
          lottery_id: params.playType,
          qishu: QiShu,
          order_status: CONSTANTS.ORDER_STATUS.EXPIRED,
          create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          remark: "当前期数已经停止下单",
        });
      let { arrays } = generateRandomArrays({
        numStart: playConfig.num_start,
        numEnd: playConfig.num_end,
      });

      let betRes = getBetMapOrder({
        list: arrays[MapList[playConfig.is_direction]],
        playType: params.playType,
        randomNumber: 0,
        amt: 1,
      });
      let numStr = betRes.map((v) => v.Ct).join(",");
      console.log("betRes", betRes);
      console.log("numStr", numStr);
      let ps = {
        lid: params.playType,
        QiShu: QiShu,
        Orders: betRes,
      };
      console.log("ps", ps);
      //下单
      let { Code, Message } = await this.service.api.Bet(ps);
      return await this.app.mysql.insert("order", {
        lottery_id: params.playType,
        qishu: QiShu,
        order_status:
          Code != 10000
            ? CONSTANTS.ORDER_STATUS.EXPIRED
            : CONSTANTS.ORDER_STATUS.NOT_OPEN,
        place_order_num: numStr,
        create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        remark: Code != 10000 ? Message : "下单成功",
      });
    }
  }
}

module.exports = ScheduleService;
