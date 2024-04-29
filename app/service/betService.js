'use strict';

const { Service } = require('egg');
const { SCHEDULE_STATUS, SCHEDULE_TRIGGER_TYPE, SCHEDULE_RUN_MODE, SCHEDULE_DELETE, ACTIVE_KYES } = require('../constants');
const { RESULT_FAIL } = require('../constants/result');
const GlobalError = require('../utils/GlobalError');

/**
 * task Service
 */
class BetService extends Service {
  // 定时任务管理
  async getBetConfigList({ page = 1, size = 20 }) {
    const limit = parseInt(size),
      offset = parseInt(page - 1) * parseInt(size);
    const [ list, total ] = await Promise.all([
      this.app.mysql.select('lotterysettings', {
        where: { is_del: SCHEDULE_DELETE.MANUAL },
        orders: [[ 'create_time', 'desc' ]],
        limit,
        offset,
      }),
      this.app.mysql.count('lotterysettings'),
    ]);
    return { list, total };
  }


//   // 获取任务执行日志详细信息
//   async scheduleLogDateil({ id, error }) {
//     const result = await this.app.mysql.get('schedule_job_log', { id });

//     return { detail: !error ? result.job_log : result.error_log, executionStatus: result.execution_status };
//   }
}

module.exports = BetService;
