/* eslint valid-jsdoc: "off" */

"use strict";

const { setResult } = require("../app/utils");
const { RESULT_FAIL } = require("../app/constants/result");

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_1607609908869_9400";

  // add your middleware config here
  config.middleware = ["logHandler", "errorHandler"];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.contextPath = "/api";

  config.proxy = true;

  /** 启动端口配置 */
  config.cluster = {
    listen: {
      port: 7002,
    },
  };

  /** 跨域，仅用于本地环境 */
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: ["*"],
  };

  /** mysql配置 */
  config.mysql = {
    client: {
      // host
      host: "38.55.233.229",
      // 端口号
      port: "3306",
      // 用户名
      user: "88848_bet",
      // 密码
      password: "xHfjfLHADeSHbcjD",
      // 数据库名
      database: "88848_bet",
    },
  };

  /** redis配置 */
  config.redis = {
    client: {
      port: 6379,
      host: "38.55.233.229",
      password: "root",
      db: 0,
    },
  };

  config.googleAuth = {
    appName: "AdminDemo",
  };

  config.cors = {
    origin: "*", // 允许所有的请求源
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  //   // 性能监控
  //   config.alinode = {
  //     server: 'wss://agentserver.node.aliyun.com:8080',
  //     appid: process.env.ADMIN_DEMO_ALINODE_APPID,
  //     secret: process.env.ADMIN_DEMO_ALINODE_APPSECRET,
  //   };

  /** 运行异常 */
  config.onerror = {
    all(err, ctx) {
      // 记录一条错误日志
      ctx.app.emit("error", err, ctx);
      ctx.body = setResult(RESULT_FAIL, "服务器繁忙");
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};

exports.axiosPlus = {
  headers: {
    common: {
      "Content-Type": "application/json; charset=UTF-8",
      // 添加认证【例如】，也可以在请求拦截器中修改具体的request config
      // 'Authorization':'19980115_520' // 不要问我19980115是什么，当然是女朋友生日呀！！！
    },
    // 可以设置请求头等属性
  },
  timeout: 5000, // 默认请求超时
  app: true, // 在app.js上启动加载
  agent: false, // 在agent.js上启动加载
};
