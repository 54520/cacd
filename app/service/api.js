"use strict";

const { Service } = require("egg");

const isSuccess = (data) => {
  return data?.msg == "true";
};

class ApiService extends Service {
  //中奖之后需要充值掉倍投数据
  async resDbClose(playType) {
    let lotterysettings = await this.app.mysql.update(
      "lotterysettings",
      {
        is_db_investment: 0, //关闭倍投
        db_amt: 0, //倍投金额
        this_continue_win_time: 0, //连续中奖次数
        this_continue_nowin_time: 0, //连续未中奖次数
        db_it_time: 1, //倍投次数
      },
      {
        where: {
          lottery_id: playType,
        },
      }
    );
    return lotterysettings;
  }

  //查询开奖结果
  async GetLotteryResult(params) {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/Period/Other/GetHistoryList",
      {
        dataType: "json",
        method: "GET",
        headers: {
          Authorization: await this.app.redis.get("token"),
        },
        data: params,
      }
    );
    return resp.data;
  }
  //查询开奖期数
  async GetPeriodInfo(params) {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/Period/Period/GetPeriodInfo",
      {
        dataType: "json",
        method: "GET",
        headers: {
          Authorization: await this.app.redis.get("token"),
        },
        data: params,
      }
    );
    return resp.data;
  }

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
        },
        data: {
          param:
            "qjGfRm9J2J6MMyZdaH5T1+VX6gbpijFb3HsfSMJ4c31DMRkQRCJtGZ1JCH0gQdvm7cVol4U1AMwerd+iXel6LXpNskfXfRiE9ny+B92B13GduKVCUbc+2g==",
        },
        dataType: "json",
      }
    );
    let token = resp.data?.Data.Token || "";
    //设置redis
    await this.app.redis.set("token", `${token ? "Bearer " + token : ""}`);
    return token;
  }

  //下单
  async Bet(params) {
    const resp = await this.ctx.curl(
      "https://wg.nteqdd.com/zh-cn/OddsLimit/Lotto/Bet",
      {
        method: "POST",
        rejectUnauthorized: false, //是否校验证书
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: await this.app.redis.get("token"),
        },
        data: params,
        dataType: "json",
      }
    );
    return resp.data;
  }

  //发送通知
  async SendNotice(params) {
    const resp = await this.ctx.curl(
      "https://api.day.app/W5DEiikoQHX8iQq2DNByRe?icon=https://pic.imgdb.cn/item/66410e190ea9cb1403e76422.jpg",
      {
        method: "POST",
        rejectUnauthorized: false, //是否校验证书
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
        data: params,
        dataType: "json",
      }
    );
    return resp.data;
  }

  //aliance平台自动挂机 - 用户key
  async alianceUserUpdateToken(params) {
    const resp = await this.ctx.curl(
      "https://www.in-alliance.cc/index.php?m=user&c=api&a=login_login",
      {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 LT-PC/Win/1702/107",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Origin: "https://www.in-alliance.cc",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
          Referer: "https://www.in-alliance.cc/index.php?c=public&a=login",
          "Accept-Language": "zh-CN",
        },
        data: params,
        dataType: "json",
      }
    );
    let user_key =
      resp.res.headers["set-cookie"]
        ?.filter((v) => v.includes("user_key"))?.[1]
        ?.split(";")?.[0] || undefined;
    user_key = decodeURI(user_key) || undefined;
    let data = resp.data;
    if (isSuccess(data)) {
      await this.app.redis.set(`${params?.username}_user_key`, user_key);
      return {
        status: 10000,
        res: `${params?.username}-登录成功 token:${user_key}`,
      };
    } else {
      return {
        status: 0,
        res: "登陆失败-" + data?.info,
      };
    }
  }

  //aliance平台自动挂机 - 更新数量
  async alianceUserUpdateNum(params) {
    let { username } = params;
    let resp = await this.ctx.curl(
      "https://www.in-alliance.cc/index.php?m=user&c=browse&a=browse2",
      {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 LT-PC/Win/1702/107",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Origin: "https://www.in-alliance.cc",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
          Referer: "https://www.in-alliance.cc/index.php?m=user&c=index&a=read",
          "Accept-Language": "zh-CN",
          Cookie: await this.app.redis.get(`${username}_user_key`),
        },
        dataType: "json",
      }
    );
    if (isSuccess(resp.data)) {
      return {
        status: 10000,
        res: `${username}-更新成功-${resp.data?.info}`,
      };
    } else {
      return {
        status: 0,
        res: `${username}-更新失败-${resp.data?.info}`,
      };
    }
  }

  //获取用户余额
  async alianceUserGetMoney(params) {
    let { username } = params;
    let Cookie = await this.app.redis.get(`${username}_user_key`);
    if (!Cookie) {
      await this.alianceUserUpdateToken(params);
    }
    let resp = await this.ctx.curl(
      "https://www.in-alliance.cc/index.php?m=user&c=index&a=home",
      {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 LT-PC/Win/1702/107",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "Cache-Control": "max-age=0",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-User": "?1",
          "Sec-Fetch-Dest": "document",
          Referer:
            "https://www.in-alliance.cc/index.php?m=user&c=index&a=index",
          "Accept-Language": "zh-CN",
          Cookie: await this.app.redis.get(`${username}_user_key`),
        },
        dataType: "text",
      }
    );
    let data = resp.data;
    //根据data里面的文本 找到   <div class="profit-money">25168</div> 里面的值  可能有多个
    let reg = /<div class="profit-money">(\d+)<\/div>/g;
    let res = data.match(reg);
    if (resp.status == 200) {
      let bl = res?.reduce((acc, cur, i) => {
        var regex = /<div\s+class="([^"]+)"[^>]*>([\s\S]*?)<\/div>/;
        var match = regex.exec(cur);
        let field = match[1] ? match[1]?.split("-")?.join("_") : "123";
        acc[`${field}_${i + 1}`] = match[2];
        return acc;
      }, {});
      return {
        status: 10000,
        res: bl,
      };
    } else {
      return {
        status: 0,
        res: `${username}-获取失败`,
      };
    }
  }

  //获取用户提现信息
  
}

module.exports = ApiService;
