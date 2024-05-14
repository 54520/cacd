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

  //
  async TAIWAI_ERBA_HANDLER_Num(params, jobHandlerLog) {
    //查询彩种配置
    let playConfig = await this.app.mysql.get("lotterysettings", {
      lottery_id: params.playType,
    });
    if (!playConfig) return await jobHandlerLog.log("未查询到彩种配置");
    playConfig = JSON.parse(JSON.stringify(playConfig));
    console.log("playConfig", playConfig);
    let {
      num_start,
      num_end,
      locating_bladder_startNum,
      is_direction,
      locating_bladder_endNum,
      bet_amount,
    } = playConfig;
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
        let num = "Num" + findOrder?.locating_bladder;
        let isWin = findOrder?.place_order_num
          ?.split(",")
          .includes(thisNotStlRes?.Details[num]);
        if (isWin) {
          //如果中奖则更新配置表的状态
          await this.service.api.resDbClose(params.playType);

          let order = await this.app.mysql.update("order", {
            id: findOrder.id,
            order_status: 1,
            win_status: 1,
            lottery_num: thisNotStlRes?.Details[num],
            remark: "已中奖",
          });
          if (order?.affectedRows == 1) {
            console.log("订单表更新成功");
            //继续下单
            let { arrays, randomNumber } = generateRandomArrays({
              numStart: num_start,
              numEnd: num_end,
              locating_bladder_startNum,
              locating_bladder_endNum,
            });
            let betRes = getBetMapOrder({
              list: arrays[MapList[is_direction]],
              playType: params.playType,
              randomNumber,
              amt: bet_amount,
            });
            let numStr = betRes.map((v) => v.Ct).join(",");
            console.log("betRes", betRes);
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
              one_amt: bet_amount,
              locating_bladder: randomNumber,
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
            win_status: 0,
            lottery_num: thisNotStlRes?.Details[num],
            remark: "未中奖",
          });
          if (order?.affectedRows == 1) {
            console.log("订单表更新成功");
            let db_amt = playConfig.db_amt * 2;
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
                  let { arrays, randomNumber } = generateRandomArrays({
                    numStart: num_start,
                    numEnd: num_end,
                    locating_bladder_startNum,
                    locating_bladder_endNum,
                  });
                  let betRes = getBetMapOrder({
                    list: arrays[MapList[is_direction]],
                    playType: params.playType,
                    randomNumber,
                    amt: bet_amount,
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
                    one_amt: bet_amount,
                    locating_bladder: randomNumber,
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
                let { arrays, randomNumber } = generateRandomArrays({
                  numStart: num_start,
                  numEnd: num_end,
                  locating_bladder_startNum,
                  locating_bladder_endNum,
                });
                let betRes = getBetMapOrder({
                  list: arrays[MapList[is_direction]],
                  playType: params.playType,
                  randomNumber,
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
                  locating_bladder: randomNumber,
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
      let { arrays, randomNumber } = generateRandomArrays({
        numStart: num_start,
        numEnd: num_end,
        locating_bladder_startNum,
        locating_bladder_endNum,
      });
      console.log("arrays", arrays);
      console.log("randomNumber", randomNumber);
      let betRes = getBetMapOrder({
        list: arrays[MapList[playConfig.is_direction]],
        playType: params.playType,
        randomNumber,
        amt: bet_amount,
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
      //   //下单
      let { Code, Message } = await this.service.api.Bet(ps);
      return await this.app.mysql.insert("order", {
        lottery_id: params.playType,
        qishu: QiShu,
        locating_bladder: randomNumber,
        one_amt: bet_amount,
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

  //监控下单
  async WATCH_WIN_ORDER(params, jobHandlerLog) {
    //查询彩种配置
    let playConfig = await this.app.mysql.get("lotterysettings", {
      lottery_id: params.playType,
    });
    if (!playConfig) return await jobHandlerLog.log("未查询到彩种配置");
    playConfig = JSON.parse(JSON.stringify(playConfig));
    console.log("playConfig", playConfig);
    let {
      num_start,
      num_end,
      locating_bladder_startNum,
      is_direction,
      locating_bladder_endNum,
      order_mode,
      this_continue_win_time,
      this_continue_nowin_time,
      continue_win_time,
      continue_nowin_time,
      is_db_investment,
      bet_amount,
    } = playConfig;
    if (order_mode != 3) return;
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
    //判断在日志表中是否能找到当前期数的下单信息
    let findOrder = orderLog.find(
      (item) =>
        (item.qishu == periodInfo?.Result?.QiShu ||
          item.qishu == periodInfo?.Result?.PreQiShu) &&
        item.order_status == 2
    );
    console.log("findOrder", findOrder);
    if (findOrder) {
      let { place_order_num, locating_bladder, is_mock, qishu, one_amt } =
        findOrder;
      let thisNotStlRes = Result?.find((v) => v.QiShu == findOrder.qishu);
      console.log("thisNotStlRes", thisNotStlRes);
      if (thisNotStlRes) {
        let num = "Num" + findOrder?.locating_bladder;
        let isWin = findOrder?.place_order_num
          ?.split(",")
          .includes(thisNotStlRes?.Details[num]);
        if (isWin) {
          let this_continue_win_time_gt = this_continue_win_time + 1;
          //判断是否是倍投中奖了
          let is_db_investment_gt = is_db_investment == 1 ? true : false;
          //如果中奖则更新配置表的状态
          await this.service.api.resDbClose(params.playType);
          await this.app.mysql.update("order", {
            id: findOrder.id,
            order_status: 1,
            win_status: 1,
            lottery_num: thisNotStlRes?.Details[num],
            remark: is_mock ? "模拟-中奖" : "中奖",
          });
          if (is_mock == 0) {
            await this.service.api.SendNotice({
              title: `期数:${qishu}中奖通知`,
              group: "中奖",
              body: `定位胆:${locating_bladder},中奖号码:${thisNotStlRes?.Details[num]},下注金额:${one_amt}`,
            });
          }
          let isGt = this_continue_win_time_gt >= continue_win_time;
          //如果有中奖则先更新配置表的状态
          await this.app.mysql.update(
            "lotterysettings",
            {
              this_continue_win_time: isGt ? 0 : this_continue_win_time_gt,
              this_continue_nowin_time: 0,
            },
            {
              where: {
                lottery_id: params.playType,
              },
            }
          );
          if (isGt || is_db_investment_gt) {
            // //则重新生成一组号码继续继续模拟下单
            let { arrays, randomNumber } = generateRandomArrays({
              numStart: num_start,
              numEnd: num_end,
              locating_bladder_startNum,
              locating_bladder_endNum,
            });
            let betRes = getBetMapOrder({
              list: arrays[MapList[is_direction]],
              playType: params.playType,
              randomNumber,
              amt: 0,
            });
            let numStr = betRes.map((v) => v.Ct).join(",");
            return await this.app.mysql.insert("order", {
              lottery_id: params.playType,
              qishu: QiShu,
              locating_bladder: randomNumber,
              order_status: CONSTANTS.ORDER_STATUS.NOT_OPEN,
              one_amt: 0,
              is_mock: 1,
              place_order_num: numStr,
              create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              remark: `模拟下单成功-当前连中超过限制次数或倍投中奖,重新生成号码`,
            });
          } else {
            return await this.app.mysql.insert("order", {
              lottery_id: params.playType,
              qishu: QiShu,
              locating_bladder,
              order_status: CONSTANTS.ORDER_STATUS.NOT_OPEN,
              place_order_num,
              is_mock: 1,
              one_amt: 0,
              create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              remark: `模拟下单成功-当前模拟连中次数${this_continue_win_time_gt}`,
            });
          }
        } else {
          await this.app.mysql.update("order", {
            id: findOrder.id,
            order_status: 0,
            win_status: 0,
            lottery_num: thisNotStlRes?.Details[num],
            remark: is_mock ? "模拟-未中奖" : "未中奖",
          });
          if (is_mock == 0) {
          }
          let this_continue_nowin_time_gt = this_continue_nowin_time + 1;
          let isGt = this_continue_nowin_time_gt >= continue_nowin_time;
          await this.app.mysql.update(
            "lotterysettings",
            {
              this_continue_nowin_time: this_continue_nowin_time_gt,
              this_continue_win_time: 0,
            },
            {
              where: {
                lottery_id: params.playType,
              },
            }
          );
          if (isGt) {
            let db_amt = playConfig.db_amt == 0 ? 1 : playConfig.db_amt * 3;
            let db_it_time = playConfig.db_it_time + 1;
            //判断是否超过最大倍投次数
            if (db_it_time > playConfig.max_db_it_time) {
              await this.service.api.resDbClose(params.playType); //清除倍投信息
              await this.app.mysql.update("order", {
                id: findOrder.id,
                order_status: 3,
                remark: "已达到最大倍投次数",
              });
              // //则重新生成一组号码继续继续模拟下单
              let { arrays, randomNumber } = generateRandomArrays({
                numStart: num_start,
                numEnd: num_end,
                locating_bladder_startNum,
                locating_bladder_endNum,
              });
              let betRes = getBetMapOrder({
                list: arrays[MapList[is_direction]],
                playType: params.playType,
                randomNumber,
                amt: 0,
              });
              let numStr = betRes.map((v) => v.Ct).join(",");
              return await this.app.mysql.insert("order", {
                lottery_id: params.playType,
                qishu: QiShu,
                locating_bladder: randomNumber,
                order_status: CONSTANTS.ORDER_STATUS.NOT_OPEN,
                place_order_num: numStr,
                is_mock: 1,
                one_amt: 0,
                create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                remark: `模拟下单成功-当前连中超过限制次数,重新生成号码`,
              });
            } else {
              //查询当前期是否已经下单了
              let isExistOrder = await this.app.mysql.get("order", {
                lottery_id: params.playType,
                qishu: QiShu,
              });
              if (isExistOrder) return;
              await this.app.mysql.update(
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
              let list = place_order_num.split(",");
              let betRes = getBetMapOrder({
                list: list,
                playType: params.playType,
                randomNumber: locating_bladder,
                amt: db_amt,
              });
              let ps = {
                lid: params.playType,
                QiShu: QiShu,
                Orders: betRes,
              };
              let { Code, Message } = await this.service.api.Bet(ps);
              await this.app.mysql.insert("order", {
                lottery_id: params.playType,
                qishu: QiShu,
                locating_bladder,
                one_amt: db_amt,
                order_status:
                  Code != 10000
                    ? CONSTANTS.ORDER_STATUS.EXPIRED
                    : CONSTANTS.ORDER_STATUS.NOT_OPEN,
                place_order_num,
                create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                remark: Code != 10000 ? Message : "倍投下单成功",
              });
              await this.service.api.SendNotice({
                title: `期数:${QiShu}倍投下单通知`,
                group: "倍投",
                body: `倍投下单成功,定位胆:${locating_bladder},倍投金额单个:${db_amt},倍投次数:${db_it_time},倍投号码:${place_order_num}，倍投结果:${
                  Code != 10000 ? Message : "倍投下单成功"
                }`,
              });
              return;
            }
          } else {
            return await this.app.mysql.insert("order", {
              lottery_id: params.playType,
              qishu: QiShu,
              locating_bladder,
              order_status: CONSTANTS.ORDER_STATUS.NOT_OPEN,
              place_order_num,
              one_amt: 0,
              is_mock: 1,
              create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              remark: `模拟下单成功-当前模拟连挂次数${this_continue_nowin_time_gt}`,
            });
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
      let { arrays, randomNumber } = generateRandomArrays({
        numStart: num_start,
        numEnd: num_end,
        locating_bladder_startNum,
        locating_bladder_endNum,
      });
      console.log("arrays", arrays);
      console.log("randomNumber", randomNumber);
      let betRes = getBetMapOrder({
        list: arrays[MapList[playConfig.is_direction]],
        playType: params.playType,
        randomNumber,
        amt: bet_amount,
      });
      let numStr = betRes.map((v) => v.Ct).join(",");
      console.log("betRes", betRes);
      console.log("numStr", numStr);
      return await this.app.mysql.insert("order", {
        lottery_id: params.playType,
        qishu: QiShu,
        locating_bladder: randomNumber,
        order_status: CONSTANTS.ORDER_STATUS.NOT_OPEN,
        place_order_num: numStr,
        one_amt: 0,
        is_mock: 1,
        create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        remark: "模拟下单成功",
      });
    }
  }

  async text() {
    //查询账号表aliance
    let aliance = await this.app.mysql.select("aliance", {
      where: {
        is_del: 0,
      },
    });
    for (let i = 0; i < aliance.length; i++) {
      let item = aliance[i];
      let { username, password, id, error_num } = item;
      if (error_num >= 3) continue;
      let { res, status } = await this.ctx.service.api.alianceUserUpdateToken({
        username,
        password,
      });
      await this.app.mysql.insert("aliance_log", {
        aliance_id: id,
        bind_no: username,
        create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        remark: res,
      });
      if (status != 10000) continue;
      //更新数量
      let Np = await this.ctx.service.api.alianceUserUpdateNum(item);
      if (Np.status != 10000) {
        await this.app.mysql.update("aliance", {
          id,
          error_num: error_num + 1,
        });
      }
      await this.app.mysql.insert("aliance_log", {
        aliance_id: id,
        bind_no: username,
        create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        remark: Np.res,
      });
    }
  }

  //重置账号的错误次数
  async RESET_ALL_ERROR_NUM(params, jobHandlerLog) {
    let list = await this.app.mysql.select("aliance", {
      where: {
        is_del: 0,
      },
    });
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      await this.app.mysql.update("aliance", {
        id: item.id,
        error_num: 0,
      });
    }
    //将aliance_log 日志表清空
    await this.app.mysql.query("truncate table aliance_log");
  }

  //重新获取账号的积分并更新
  async UPDATE_USER_IGl() {
    let list = await this.app.mysql.select("aliance", {
      where: {
        is_del: 0,
      },
    });
    for (let i = 0; i < list.length; i++) {
      let it = list[i];
      const balance = await this.ctx.service.api.alianceUserGetMoney(it);
      if (balance.status == 10000) {
        let {profit_money_1,profit_money_2} = balance.res
        await this.app.mysql.update('aliance',{
            id:it?.id,
            profit_money_1,
            update_time:dayjs().format("YYYY-MM-DD HH:mm:ss"),
            profit_money_2
        })
      }

    }
  }
}

module.exports = ScheduleService;
