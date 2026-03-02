import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const databasePort = Number(
          config.get<string>('DATABASE_PORT', '5432'),
        );
        const databaseSsl =
          config.get<string>('DATABASE_SSL', 'false').toLowerCase() === 'true';

        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: Number.isFinite(databasePort) ? databasePort : 5432,
          username: config.get<string>('DATABASE_USERNAME', 'payment_user'),
          password: config.get<string>('DATABASE_PASSWORD', 'payment_password'),
          database: config.get<string>('DATABASE_NAME', 'payment_db'),
          autoLoadEntities: true,
          synchronize: false,
          migrations: ['dist/migrations/*.js'],
          migrationsRun: true,
          logging: config.get<string>('NODE_ENV') === 'development',
          ssl: databaseSsl ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
