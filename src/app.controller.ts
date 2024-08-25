import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import * as path from "path";
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('html')
  getHtml(@Res() res: Response) {
    console.log('html');
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
}
