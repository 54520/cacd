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

  //更新token
  router.get(
    `/user/updateToken`,
    checkTokenHandler,
    controller.api.getGameToken
  );

  //获取用户余额信息
  router.get(
    `/user/getBalance`,
    checkTokenHandler,
    controller.api.getConsoleInfo
  );

  //获取投注记录
  router.get(
    `/Bet/getBetRecord`,
    checkTokenHandler,
    controller.api.getBetRecord
  );

  //获取投注记录
  router.post(
    `/Bet/getBetLogList`,
    checkTokenHandler,
    controller.bet.getBetLogList
  );

  //获取开奖结果
    router.get(
        `/Bet/getPeriodInfo`,
        checkTokenHandler,
        controller.api.GetPeriodInfo
    );
};
