"use strict";

const { Service } = require("egg");
const {
  SCHEDULE_STATUS,
  SCHEDULE_TRIGGER_TYPE,
  SCHEDULE_RUN_MODE,
  SCHEDULE_DELETE,
  ACTIVE_KYES,
} = require("../constants");
const { RESULT_FAIL } = require("../constants/result");
const GlobalError = require("../utils/GlobalError");

/**
 * task Service
 */
class BetService extends Service {
  // 定时任务管理
  async getBetConfigList({ page = 1, size = 20 }) {
    const limit = parseInt(size),
      offset = parseInt(page - 1) * parseInt(size);
    const [list, total] = await Promise.all([
      this.app.mysql.select("lotterysettings", {
        where: { is_del: SCHEDULE_DELETE.MANUAL },
        orders: [["create_time", "desc"]],
        limit,
        offset,
      }),
      this.app.mysql.count("lotterysettings"),
    ]);
    return { list, total };
  }

  //获取订单日志
  async getBetLogList({ page = 1, size = 20 }) {
    const limit = parseInt(size),
      offset = parseInt(page - 1) * parseInt(size);
    const [list, total] = await Promise.all([
      this.app.mysql.select("order", {
        orders: [["create_time", "desc"]],
        limit,
        offset,
      }),
      this.app.mysql.count("order"),
    ]);
    return { list, total };
  }
}

module.exports = BetService;
