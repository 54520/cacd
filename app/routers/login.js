'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, config } = app;
  const checkTokenHandler = app.middleware.checkTokenHandler();

  // 登陆
  router.post(`/login`, controller.login.login);
  // 获取登陆详细信息
  router.get(`/login/info`, checkTokenHandler, controller.login.loginInfo);
  // 登出
  router.post(`/logout`, checkTokenHandler, controller.login.logout);
};
