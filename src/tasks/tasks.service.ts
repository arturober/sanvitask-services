import { EntityManager, EntityRepository } from '@mikro-orm/better-sqlite';
import { raw, ref } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImageService } from 'src/commons/image/image.service';
import { User } from 'src/users/entities/user.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddSubtaskDto } from './dto/add-subtask.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskPostionStatusDto } from './dto/update-task-position-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Subtask } from './entities/subtask';
import { Task, TaskStatus } from './entities/task';
import { TaskComment } from './entities/task_comment';
import { CompleteSubtaskDto } from './dto/complete-subtask.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: EntityRepository<Task>,
    @InjectRepository(Subtask)
    private readonly subtaskRepository: EntityRepository<Subtask>,
    @InjectRepository(TaskComment)
    private readonly commentRepository: EntityRepository<TaskComment>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly imageService: ImageService,
  ) {}

  private getTaskQuery(authUser: User) {
    const query = this.taskRepository.createQueryBuilder('task').select('*');
    query.addSelect(raw(`${authUser.id} = task.creator_id as mine`));
    return query;
  }

  findAll(authUser: User): Promise<Task[]> {
    return this.getTaskQuery(authUser)
      .where({ participants: authUser.id })
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .leftJoinAndSelect('task.participants', 'participants')
      .orderBy({ position: 'asc', createdAt: 'desc' })
      .getResultList();
  }

  // TODO: Añadir el booleano indicando si el usuario logueado es el creador
  async findOne(authUser: User, id: number): Promise<Task> {
    const task = await this.getTaskQuery(authUser)
      .where({ id: id })
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .leftJoinAndSelect('task.participants', 'participants')
      .getSingleResult();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.participants.find((u) => u.id === authUser.id)) {
      throw new ForbiddenException('You are not a participant of this task');
    }

    return task;
  }

  async create(authUser: User, task: CreateTaskDto): Promise<Task> {
    if (task.filepath) {
      task.filepath = await this.imageService.saveImage('tasks', task.filepath);
    }
    task.creator = ref(authUser);
    task.position =
      (await this.taskRepository.count({ status: TaskStatus.PENDING })) + 1;

    const newTask = this.taskRepository.create(task);
    newTask.participants.add(authUser);
    await this.taskRepository.getEntityManager().persistAndFlush(newTask);
    return newTask;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOneOrFail(id);
    this.taskRepository.getEntityManager().assign(task, updateTaskDto);

    if (updateTaskDto.filepath) {
      task.filepath = await this.imageService.saveImage(
        'tasks',
        updateTaskDto.filepath,
      );
    }

    await this.taskRepository.getEntityManager().persistAndFlush(task);
    return task;
  }

  async updateStatus(id: number, updateTaskDto: UpdateTaskPostionStatusDto) {
    console.log(updateTaskDto);
    return this.taskRepository
      .getEntityManager()
      .transactional(async (em: EntityManager) => {
        const task = await em.findOneOrFail(Task, id);

        if (
          updateTaskDto.status !== undefined &&
          updateTaskDto.status !== task.status
        ) {
          await em
            .createQueryBuilder(Task)
            .update({ position: raw('position - 1') })
            .where({
              status: task.status,
              position: { $gt: task.position },
            })
            .execute();
          task.status = updateTaskDto.status;

          if (!updateTaskDto.position) {
            task.position =
              (await em.count(Task, { status: TaskStatus.PENDING })) + 1;
          } else {
            task.position = updateTaskDto.position;
            await em.nativeUpdate(
              Task,
              { status: task.status, position: { $gte: task.position } },
              { position: raw('position + 1') },
            );
          }
        } else if (updateTaskDto.position) {
          if (updateTaskDto.position < task.position) {
            await em.nativeUpdate(
              Task,
              {
                status: task.status,
                position: {
                  $gte: updateTaskDto.position,
                  $lt: task.position,
                },
              },
              { position: raw('position + 1') },
            );
          } else if (updateTaskDto.position > task.position) {
            await em.nativeUpdate(
              Task,
              {
                status: task.status,
                position: {
                  $lte: updateTaskDto.position,
                  $gt: task.position,
                },
              },
              { position: raw('position - 1') },
            );
          }
          task.position = updateTaskDto.position;
        }

        return task;
      });
  }

  async remove(authUser: User, id: number): Promise<void> {
    const task = await this.taskRepository.findOneOrFail({ id });

    if (task.creator.id === authUser.id) {
      // Creador borra la tarea
      if (task.filepath) {
        await this.imageService.removeImage(task.filepath);
      }
      await this.taskRepository.getEntityManager().removeAndFlush(task);
    } else {
      await this.removeParticipant(authUser, task.id, authUser.id);
    }
  }

  async addSubtask(
    authUser: User,
    taskId: number,
    addSubtaskDto: AddSubtaskDto,
  ): Promise<Subtask> {
    const newSubtask = this.subtaskRepository.create({
      description: addSubtaskDto.description,
      task: this.taskRepository.getReference(taskId),
    });
    console.log(newSubtask);
    await this.subtaskRepository.getEntityManager().persistAndFlush(newSubtask);
    return newSubtask;
  }

  async removeSubtask(authUser: User, id: number): Promise<void> {
    const subtask = await this.subtaskRepository.findOneOrFail({ id });
    const task = await this.taskRepository.findOneOrFail({
      id: subtask.task.id,
      participants: authUser.id,
    });

    if (!task) {
      throw new Error('You are not a participant of this task');
    }

    await this.subtaskRepository.nativeDelete({ id });
  }

  async updateSubtask(
    authUser: User,
    id: number,
    updateSubtaskDto: CompleteSubtaskDto,
  ): Promise<Subtask> {
    const subtask = await this.subtaskRepository.findOneOrFail({ id });
    const task = await this.taskRepository.findOneOrFail({
      id: subtask.task.id,
      participants: authUser.id,
    });

    if (!task) {
      throw new Error('You are not a participant of this task');
    }

    subtask.completed = updateSubtaskDto.completed;

    await this.subtaskRepository.getEntityManager().persistAndFlush(subtask);
    return subtask;
  }

  async addParticipant(
    authUser: User,
    taskId: number,
    userId: number,
  ): Promise<User> {
    const task = await this.taskRepository.findOneOrFail({
      id: taskId,
    });

    if (task.creator.id !== authUser.id) {
      throw new ForbiddenException('You are not the creator of this task');
    }

    const user = await this.userRepository.findOneOrFail({
      id: userId,
    });

    const userExists = await this.taskRepository.count({
      id: taskId,
      participants: userId,
    });

    if (userExists) {
      throw new BadRequestException(
        'This user is already a participant of this task',
      );
    }

    task.participants.add(user);
    await this.taskRepository.getEntityManager().persistAndFlush(task);
    return user;
  }

  async removeParticipant(
    authUser: User,
    taskId: number,
    userId: number,
  ): Promise<void> {
    const task = await this.taskRepository.findOneOrFail({
      id: taskId,
    });

    if (authUser.id !== userId && task.creator.id !== authUser.id) {
      throw new ForbiddenException('You are not the creator of this task');
    }

    const em = this.taskRepository.getEntityManager();
    const taskMeta = em.getMetadata().get(Task);
    const participantsProp = taskMeta.properties.participants;

    // Nombres de la tabla y columnas de la relación
    const pivotTableName = participantsProp.pivotTable;
    const taskIdColumn = participantsProp.joinColumns[0];
    const userIdColumn = participantsProp.inverseJoinColumns[0];

    const sql = `DELETE FROM "${pivotTableName}" WHERE "${userIdColumn}" = ? AND "${taskIdColumn}" = ?`;
    await em.getConnection().execute(sql, [userId, taskId]);
  }

  async addComment(
    authUser: User,
    taskId: number,
    commentDto: AddCommentDto,
  ): Promise<TaskComment> {
    const comment = this.commentRepository.create({
      comment: commentDto.comment,
      task: this.taskRepository.getReference(taskId),
      user: this.userRepository.getReference(authUser.id),
    });
    await this.commentRepository.getEntityManager().persistAndFlush(comment);
    return comment;
  }

  async getComments(
    taskId: number,
    page = 1,
  ): Promise<[TaskComment[], number]> {
    return await this.commentRepository.findAndCount(
      { task: taskId },
      {
        populate: ['user'],
        orderBy: { createdAt: 'desc' },
        limit: 10,
        offset: (page - 1) * 10,
      },
    );
  }
}
