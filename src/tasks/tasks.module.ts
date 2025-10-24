import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommonsModule } from 'src/commons/commons.module';
import { TaskCollaboratorGuard } from './guards/task-collaborator/task-collaborator.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature(['Task', 'Subtask', 'User', 'TaskComment']),
    CommonsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskCollaboratorGuard],
})
export class TasksModule {}
