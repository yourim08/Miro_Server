import { Controller, Get, Req, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import type { Request } from 'express';


@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) { }
  

  @Post('addMaterial')
  async addMaterial(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialService.addMaterial(createMaterialDto);
  }

  @Get('list')
  async getMaterials(@Query('rootClassUid') rootClassUid: string) {
    if (!rootClassUid) {
      throw new BadRequestException('rootClassUid 쿼리 파라미터가 필요합니다.');
    }
    return this.materialService.getMaterialsByClassUid(rootClassUid);
  }

}