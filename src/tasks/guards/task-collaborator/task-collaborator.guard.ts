import { EntityManager } from '@mikro-orm/better-sqlite';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { Task } from 'src/tasks/entities/task';
import { User } from 'src/users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class TaskCollaboratorGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as RequestWithUser).user; // Asumimos que JwtAuthGuard ya puso el usuario aquí.
    const taskId = +request.params.id; // El '+' convierte el string a número.

    await this.em.findOneOrFail(Task, taskId);

    const isCollaborator = await this.em.count(Task, {
      id: taskId,
      participants: user.id,
    });

    console.log(taskId, user.id, isCollaborator);

    if (!isCollaborator) {
      throw new ForbiddenException('You are not a collaborator of this task');
    }

    return true;
  }
}
