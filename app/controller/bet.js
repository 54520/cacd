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

  /**
   * al 操作日志
   */
  async getAlianceLogList() {
    const { ctx } = this;
    const result = await ctx.service.betService.getAlianceLogList(
      ctx.request.body
    );
    ctx.body = setResult({ data: result });
  }

  /**
   * al 账号列表
   */
  async getNoList() {
    const { ctx } = this;
    const result = await ctx.service.betService.getNoList(ctx.request.body);
    ctx.body = setResult({ data: result });
  }

  /**
   * al 新增编辑
   */
  async noAddOrEdit() {
    const { ctx } = this;
    const result = await ctx.service.betService.editNo(ctx.request.body);
    ctx.body = setResult({ data: result });
  }

  //删除账号
  async deleteNo(data) {
    let { id } = data;
    let resp =  await this.app.mysql.update(
      "aliance",
      {
        is_del: 1,
      },
      {
        where: { id },
      }
    );
    if(resp.affectedRows == 1){
      return ctx.body = setResult();
    }
  }
}

module.exports = BetController;
