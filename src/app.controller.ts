/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Logger, Query, Render, Res } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { EcashService } from './ecash.service';
import { Response } from 'express';
import * as demo_search_data from './config/demo_search_data.json';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ecashService: EcashService,
  ) {}
  private readonly logger = new Logger(EcashService.name);

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/i')
  root(@Res() res: Response) {
    return res.render('index', { ecashAmount: 1, ...demo_search_data });
  }
  @Get('s')
  async searchBrave2(
    @Res() res: Response,
    @Query('q') q: string,
    @Query('ecash') ecash: string,
    @Query('country') country?: string,
    @Query('search_lang') searchLang?: string,
    @Query('ui_lang') uiLang?: string,
    @Query('count') count?: number,
    @Query('offset') offset?: number,
  ): Promise<any> {
    const price = parseInt(process.env.BRAVE_WEB_SEARCH_PRICE || '1');
    if (q === undefined || q.length === 0) {
      return res.render('error', {
        code: 400,
        data: `Query parameter 'q' is required`,
      });
    }

    if (ecash === undefined || ecash.length === 0) {
      return res.render('error', {
        code: 400,
        data: `Query parameter 'ecash' is required. Pay ${price} sat to search`,
      });
    }

    // check token
    try {
      await this.ecashService.checkEcashAmount(ecash, price);
    } catch (error) {
      this.logger.error('Error checking ecash amount', error.stack);
      return res.render('error', {
        code: 400,
        data: error.message,
      });
    }

    // receive token
    let ecashAmount = 0;
    try {
      ecashAmount = await this.ecashService.receiveCashu(ecash);
    } catch (error) {
      this.logger.error('Receive sat error', error.stack);
      return res.render('error', {
        code: 400,
        data: error.message,
      });
    }

    // start to query
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}`;
    const headers = {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
    };

    try {
      const response = await axios.get(url, { headers });
      return res.render('index', { ecashAmount, ...response.data });
    } catch (error) {
      console.error('Error fetching data from Brave Search API', error);
      return res.render('error', {
        code: 400,
        data: error.message || 'Query Rate Limit Exceeded',
      });
    }
  }

  @Get('search')
  async searchBrave(
    @Query('q') q: string,
    @Query('ecash') ecash: string,
    @Query('country') country?: string,
    @Query('search_lang') searchLang?: string,
    @Query('ui_lang') uiLang?: string,
    @Query('count') count?: number,
    @Query('offset') offset?: number,
  ): Promise<any> {
    if (q === undefined || q.length === 0) {
      return {
        code: 400,
        data: 'q is required',
      };
    }

    if (ecash === undefined || ecash.length === 0) {
      return {
        code: 400,
        data: 'ecash is required',
      };
    }

    try {
      const mintAmount = parseInt(process.env.PRICE_BRAVE_SEARCH || '1');
      await this.ecashService.checkEcashAmount(ecash, mintAmount);
    } catch (error) {
      this.logger.error('Error checking ecash amount', error.stack);
      return {
        code: 400,
        data: error.message,
      };
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}`;
    const headers = {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
    };

    try {
      const response = await axios.get(url, { headers });
      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching data from Brave Search API', error);
      return {
        code: 400,
        data: error.message || 'Query Rate Limit Exceeded',
      };
    }
  }
}
