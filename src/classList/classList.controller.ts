import { Controller, Get, Req, Post, Body, BadRequestException } from '@nestjs/common';
import { ClassListService } from './classList.service';
import { CreateClassListDto } from './dto/create-classList.dto';
import type { Request } from 'express';


@Controller('classList')
export class ClassListController {
  constructor(private readonly classListService: ClassListService) { }

  @Post('addClass')
  async addClass(@Body() createClassListDto: CreateClassListDto) {
    return this.classListService.addClassList(createClassListDto);
  }

  @Get('open')
  async getOpenClasses(@Req() req: Request) {
    const currentUserUid = req.headers['x-uid'] as string;
    if (!currentUserUid) {
      throw new BadRequestException('사용자 UID 필요');
    }
    const classes = await this.classListService.getOpenClassesExcludingCreator(currentUserUid);
    return { data: classes };
  }

  @Get('mentoClass')
  async getMentoClass(@Req() req: Request) {
    const currentUserUid = req.headers['x-uid'] as string;
    if (!currentUserUid) {
      throw new BadRequestException('사용자 UID 필요');
    }

    const mentoClass = await this.classListService.getMentoClasses(currentUserUid);
    return { data: mentoClass };
  }

  @Get('mentiClass')
  async getMentiClass(@Req() req: Request) {
    const currentUserUid = req.headers['x-uid'] as string;
    if (!currentUserUid) {
      throw new BadRequestException('사용자 UID 필요');
    }

    const mentiClasses = await this.classListService.getMentiClasses(currentUserUid);
    return { data: mentiClasses };
  }

  @Post('join')
  async joinClass(@Req() req: Request, @Body() body: { classUid: string }) {
    const currentUserUid = req.headers['x-uid'] as string;
    if (!currentUserUid) {
      throw new BadRequestException('사용자 UID 필요');
    }

    if (!body.classUid) {
      throw new BadRequestException('classUid 필요');
    }

    const result = await this.classListService.joinClass(body.classUid, currentUserUid);
    return { data: result };
  }

  @Post('start')
  async startClass(@Body() body: { classUid: string }) {
    if (!body.classUid) throw new BadRequestException('classUid 필요');

    return await this.classListService.startClass(body.classUid);
  }
}
