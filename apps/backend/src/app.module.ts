import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { CustomersModule } from './customers/customers.module';
import { LocationsModule } from './locations/locations.module';
import { ProductionOrdersModule } from './production-orders/production-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { FilesModule } from './files/files.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),

        autoLoadEntities: true,

        synchronize:
          configService.get<string>('NODE_ENV') === 'development',

        ssl:
          configService.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    SupabaseModule,
    CustomersModule,
    LocationsModule,
    ProductionOrdersModule,
    InvoicesModule,
    FilesModule,
    PdfModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
