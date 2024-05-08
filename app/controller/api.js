'use strict';

const Controller = require('egg').Controller;

const { setResult } = require('../utils');

class ApiController extends Controller {
    async getGameToken(){
        const { ctx } = this;
        const result = await ctx.service.api.getToken()
        console.log('resulresultresultresultt',result);
    }
}