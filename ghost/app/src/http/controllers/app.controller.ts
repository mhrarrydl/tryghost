import { Controller, Get } from '@nestjs/common';
import { AppService } from '../../ghost/app/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    this.appService = appService;
    console.log('AppController constructor');
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/say')
  saySomething(): string {
    return 'something!';
  }
}
