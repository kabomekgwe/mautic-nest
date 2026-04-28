import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FormService } from '../services/form.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formService: FormService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.formService.findAll({ page: page ? parseInt(page,10) : 1, limit: limit ? parseInt(limit,10) : 30 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.formService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) { return this.formService.create(data); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) { return this.formService.update(id, data); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.formService.remove(id); }

  @Post(':id/submissions')
  @HttpCode(HttpStatus.CREATED)
  async submit(@Param('id') id: string, @Body() data: { data: Record<string, any>; ipAddress?: string; userAgent?: string }) {
    return this.formService.submit(id, data);
  }

  @Get(':id/submissions')
  async getSubmissions(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.formService.getSubmissions(id, { page: page ? parseInt(page,10) : 1, limit: limit ? parseInt(limit,10) : 30 });
  }

  @Post(':id/actions')
  @HttpCode(HttpStatus.CREATED)
  async addAction(@Param('id') id: string, @Body() data: any) { return this.formService.addAction(id, data); }
}
