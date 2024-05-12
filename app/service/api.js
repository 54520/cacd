"use strict";

const { Service } = require("egg");

class ApiService extends Service {
  //中奖之后需要充值掉倍投数据
  async resDbClose(playType) {
    let lotterysettings = await this.app.mysql.update(
      "lotterysettings",
      {
        is_db_investment: 0, //关闭倍投
        db_amt: 1, //倍投金额
        db_it_time: 1, //倍投次数
      },
      {
        where: {
          lottery_id: playType,
        },
      }
    );
    return lotterysettings;
  }

  //查询开奖结果
  async GetLotteryResult(params) {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/Period/Other/GetHistoryList",
      {
        dataType: "json",
        method: "GET",
        headers: {
          Authorization: await this.app.redis.get("token"),
        },
        data: params,
      }
    );
    return resp.data;
  }
  //查询开奖期数
  async GetPeriodInfo(params) {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/Period/Period/GetPeriodInfo",
      {
        dataType: "json",
        method: "GET",
        headers: {
          Authorization: await this.app.redis.get("token"),
        },
        data: params,
      }
    );
    return resp.data;
  }

  //根据params获取token
  async getToken() {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/Api/Rec/User/ApiGameLogin",
      {
        method: "POST",
        rejectUnauthorized: false, //是否校验证书
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
        data: {
          param:
            "qjGfRm9J2J6MMyZdaH5T1+VX6gbpijFb3HsfSMJ4c31DMRkQRCJtGZ1JCH0gQdvm7cVol4U1AMwerd+iXel6LXpNskfXfRiE9ny+B92B13GduKVCUbc+2g==",
        },
        dataType: "json",
      }
    );
    let token = resp.data?.Data.Token || "";
    //设置redis
    await this.app.redis.set("token", `${token ? "Bearer " + token : ""}`);
    return token;
  }

  //下单
  async Bet(params) {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/OddsLimit/Lotto/Bet",
      {
        method: "POST",
        rejectUnauthorized: false, //是否校验证书
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: await this.app.redis.get("token"),
        },
        data: params,
        dataType: "json",
      }
    );
    return resp.data;
  }
}

module.exports = ApiService;
