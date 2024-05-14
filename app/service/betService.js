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
const dayjs = require("dayjs");

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

  //获取订单日志
  async getAlianceLogList({ page = 1, size = 20 }) {
    const limit = parseInt(size),
      offset = parseInt(page - 1) * parseInt(size);
    const [list, total] = await Promise.all([
      this.app.mysql.select("aliance_log", {
        orders: [["create_time", "desc"]],
        limit,
        offset,
      }),
      this.app.mysql.count("aliance_log"),
    ]);
    return { list, total };
  }

  //获取账号列表
  async getNoList({ page = 1, size = 20 }) {
    const limit = parseInt(size),
      offset = parseInt(page - 1) * parseInt(size);
    const [list, total] = await Promise.all([
      this.app.mysql.select("aliance", {
        orders: [["create_time", "desc"]],
        limit,
        where: { is_del: 0 },
        offset,
      }),
      this.app.mysql.count("aliance"),
    ]);
    // //并且去查询余额
    // for (let i = 0; i < list.length; i++) {
    //   let it = list[i];
    //   const balance = await this.ctx.service.api.alianceUserGetMoney(list[i]);
    //   if (balance.status == 10000) {
    //     Object.assign(it, balance.res);
    //   }
    // }
    return { list, total };
  }

  async editNo(data) {
    let { id, username, password } = data;
    if (!id) {
      //插入到aliance表
      let newRow = await this.app.mysql.insert("aliance", {
        username,
        password,
        create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        update_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      })
      return newRow?.insertId
    } else {
      await this.app.mysql.update(
        "aliance",
        {
          username,
          password,
          update_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          where: { id },
        }
      );
      return id
    }
  }
}

module.exports = BetService;
