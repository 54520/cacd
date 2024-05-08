"use strict";

const { Service } = require("egg");

class ApiService extends Service {

  //根据params获取token
  async getToken() {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/Api/Rec/User/ApiGameLogin",
      {
        method: "POST",
        rejectUnauthorized: false, //是否校验证书
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          aaa:123
        },
        data: {
            param:'qjGfRm9J2J6MMyZdaH5T1+VX6gbpijFb3HsfSMJ4c31DMRkQRCJtGZ1JCH0gQdvm7cVol4U1AMwerd+iXel6LXpNskfXfRiE9ny+B92B13GduKVCUbc+2g=='
        },
        dataType: "json",
      }
    );
    console.log('resp',resp);
    return 11111
  }
}

module.exports = ApiService;
