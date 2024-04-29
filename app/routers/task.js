"use strict";

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const { router, controller, config, middleware } = app;
  const checkTokenHandler = middleware.checkTokenHandler();
  // 定时任务列表
  router.get(
    `/task/schedule/list`,
    checkTokenHandler,
    controller.task.scheduleList
  );
  // 修改/新增定时任务
  router.post(
    `/task/schedule/edit`,
    checkTokenHandler,
    controller.task.editSchedule
  );
  // 删除定时任务
  router.post(
    `/task/schedule/delete`,
    checkTokenHandler,
    controller.task.deleteSchedule
  );
  // 更新定时任务状态
  router.post(
    `/task/schedule/status/update`,
    checkTokenHandler,
    controller.task.updateStatusSchedule
  );
  // 执行任务
  router.post(
    `/task/schedule/run`,
    checkTokenHandler,
    controller.task.runSchedule
  );
  // 定时任务日志列表
  router.get(
    `/task/schedule/log/list`,
    checkTokenHandler,
    controller.task.scheduleLogList
  );
  // 获取任务执行日志详细信息
  router.get(
    `/task/schedule/log/detail`,
    checkTokenHandler,
    controller.task.scheduleLogDateil
  );
  //获取彩种配置信息
  router.get(
    `/Bet/getBetConfigList`,
    checkTokenHandler,
    controller.bet.getBetConfigList
  );
};
