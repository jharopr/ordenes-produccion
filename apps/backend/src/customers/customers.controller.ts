import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { CreateCustomerDto, CustomerQueryDto, UpdateCustomerDto } from './customers.dto';
import { CustomersService } from './customers.service';

@ApiTags('Clientes')
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}
  @Post() create(@Body() dto: CreateCustomerDto) { return this.service.create(dto); }
  @Get() findAll(@Query() query: CustomerQueryDto) { return this.service.findAll(query); }
  @Get('default') findDefault() { return this.service.findDefault(); }
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const directory = join(process.cwd(), 'apps', 'backend', 'uploads');
        mkdirSync(directory, { recursive: true });
        callback(null, directory);
      },
      filename: (_request, file, callback) => {
        callback(null, `logo-${randomUUID()}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        return callback(new BadRequestException('El logo debe ser una imagen PNG, JPG o WEBP.'), false);
      }
      callback(null, true);
    },
  }))
  uploadLogo(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Debe seleccionar una imagen para el logo.');
    return this.service.updateLogo(id, `/uploads/${file.filename}`);
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) { return this.service.update(id, dto); }
}
