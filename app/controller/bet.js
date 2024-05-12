"use strict";

const Controller = require("egg").Controller;

const { setResult } = require("../utils");

/**
 * task Controller
 */
class BetController extends Controller {
  /**
   * 定时任务管理
   */
  async getBetConfigList() {
    const { ctx } = this;
    const result = await ctx.service.betService.getBetConfigList(
      ctx.request.query
    );
    ctx.body = setResult({ data: result });
  }

  /**
   * 订单日志
   */
  async getBetLogList() {
    const { ctx } = this;
    const result = await ctx.service.betService.getBetLogList(ctx.request.body);
    ctx.body = setResult({ data: result });
  }
}

module.exports = BetController;
