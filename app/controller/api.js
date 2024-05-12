"use strict";

const Controller = require("egg").Controller;

const { setResult } = require("../utils");

class ApiController extends Controller {
  async getGameToken() {
    const { ctx } = this;
    const result = await ctx.service.api.getToken();
    ctx.body = setResult({ data: result });
  }

  //获取余额信息
  async getConsoleInfo() {
    const { ctx } = this;
    const resp = await ctx.curl(
      "https://wg.nteqdd.com/zh-cn/OddsLimit/Lotto/GetMoney",
      {
        method: "GET",
        dataType: "json",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: await this.app.redis.get("token"),
        },
      }
    );
    ctx.body = resp.data;
  }

  //获取投注记录
  async getBetRecord() {
    const { ctx } = this;
    const resp = await ctx.curl(
      "https://wg.nteqdd.com/zh-cn/OddsLimit/Report/GetOrderInfo",
      {
        method: "GET",
        dataType: "json",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: await this.app.redis.get("token"),
        },
        data:ctx.query
      }
    );
    ctx.body = resp.data;
  }

    //获取开奖结果
    async GetPeriodInfo() {
        const { ctx } = this;
        const resp = await ctx.curl(
          "https://wg.nteqdd.com/zh-cn/Period/Period/GetPeriodInfo",
          {
            method: "GET",
            dataType: "json",
            headers: {
              Accept: "*/*",
              "Content-Type": "application/json",
              Authorization: await this.app.redis.get("token"),
            },
            data:ctx.query
          }
        );
        ctx.body = resp.data;
      }
}

module.exports = ApiController;
