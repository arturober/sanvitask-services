import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import configuration from './app.config';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule.forRoot({ googleId: configuration().google_id }),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
