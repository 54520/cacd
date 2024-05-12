"use strict";

const crypto = require("crypto");

const { RESULT_SUCC } = require("./../constants/result");
const { eum, playTpyeOp } = require("../config/index");

exports.generateRandomArrays = ({ numStart = 0, numEnd = 9 }) => {
  // 生成 numStart 到 numEnd 的数值数组
  const num = Array.from(
    { length: numEnd - numStart + 1 },
    (_, index) => numStart + index
  );

  // 生成 start 和 end 之间的随机数
  const randomNumber =
    Math.floor(Math.random() * (numEnd - numStart + 1)) + numStart;

  // 生成正向数组
  const forwardArray = [];
  while (forwardArray.length < 5) {
    const randomNum =
      Math.floor(Math.random() * (numEnd - numStart + 1)) + numStart;
    if (!forwardArray.includes(randomNum) && randomNum !== randomNumber) {
      forwardArray.push(randomNum);
    }
  }

  // 返回结果对象，包括随机数和数组
  return {
    randomNumber: randomNumber,
    arrays: {
      forward: forwardArray,
      backward: num.filter((v) => !forwardArray.includes(v)),
    },
  };
};

exports.getBetMapOrder = (result) => {
  let { amt, playType, randomNumber, list } = result;
  if (playType == eum.TAIWAI_ERBA) {
    //台湾二八数据
    let betMap = playTpyeOp[playType].betMap;
    let thisBet = betMap[randomNumber];
    let betOrder = list?.map((v) => {
      return {
        Bm: amt,
        Ct: v + "",
        Sd: thisBet[v],
      };
    });
    return betOrder;
  }
};

/**
 * 接口统一返回格式
 * @param {*} data
 * code:Number 状态码
 * message:String 提示，code非RESULT_SUCC时必传
 * data:Object 返回数据
 */
exports.setResult = (data) => {
  return {
    Code: (data && data.code) || RESULT_SUCC,
    Message: (data && data.messages) || "success",
    Result: data && data.data,
  };
};

/**
 * 生成管理员密码
 * @param {*} length 密码长度
 */
exports.generateAdminPwd = (length) => {
  const pasArr = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "_",
    "-",
    "$",
    "%",
    "&",
    "@",
    "+",
    "!",
  ];
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += pasArr[Math.floor(Math.random() * pasArr.length)];
  }
  return pwd;
};

/**
 * 获取md5
 * @param {*} str 字符串
 */
exports.getMd5 = (str) => {
  return crypto.createHash("md5").update(str).digest("hex");
};

/**
 * 生成管理员密码
 * @param {*} length 密码长度
 */
exports.generateAdminPwd = (length) => {
  const pasArr = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "_",
    "-",
    "$",
    "%",
    "&",
    "@",
    "+",
    "!",
  ];
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += pasArr[Math.floor(Math.random() * pasArr.length)];
  }
  return pwd;
};

/**
 * 模版字符串替换
 * @param {*} str 模版字符串
 * @param {*} args 替换值
 */
exports.formatStr = (str, ...args) => {
  if (str === "") return "";
  for (const i in args) {
    str = str.replace(new RegExp("\\{" + i + "\\}", "g"), args[i] || "");
  }
  return str;
};
