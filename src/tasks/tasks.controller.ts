import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthUser } from 'src/auth/decorators/user.decorator';
import { User } from 'src/users/entities/user.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddSubtaskDto } from './dto/add-subtask.dto';
import { CompleteSubtaskDto } from './dto/complete-subtask.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskPostionStatusDto } from './dto/update-task-position-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskCollaboratorGuard } from './guards/task-collaborator/task-collaborator.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createTaskDto: CreateTaskDto,
    @AuthUser() authUser: User,
  ) {
    return {
      task: await this.tasksService.create(authUser, createTaskDto),
    };
  }

  @Get()
  async findAll(@AuthUser() authUser: User) {
    return { tasks: await this.tasksService.findAll(authUser) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    return { task: await this.tasksService.findOne(authUser, +id) };
  }

  @Put(':id')
  @UseGuards(TaskCollaboratorGuard)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateTaskDto: UpdateTaskDto,
  ) {
    return {
      task: await this.tasksService.update(+id, updateTaskDto),
    };
  }

  @Put(':id/status')
  @UseGuards(TaskCollaboratorGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateTaskDto: UpdateTaskPostionStatusDto,
  ) {
    return {
      task: await this.tasksService.updateStatus(+id, updateTaskDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TaskCollaboratorGuard)
  async remove(@AuthUser() authUser: User, @Param('id') id: string) {
    await this.tasksService.remove(authUser, +id);
  }

  @Post(':id/subtasks')
  @UseGuards(TaskCollaboratorGuard)
  @HttpCode(HttpStatus.CREATED)
  async addSubtask(
    @AuthUser() authUser: User,
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    addSubtaskDto: AddSubtaskDto,
  ) {
    return {
      subtask: await this.tasksService.addSubtask(authUser, +id, addSubtaskDto),
    };
  }

  @Delete('subtasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSubtask(@AuthUser() authUser: User, @Param('id') id: string) {
    await this.tasksService.removeSubtask(authUser, +id);
  }

  @Put('subtasks/:id')
  async updateSubtask(
    @AuthUser() authUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateSubtaskDto: CompleteSubtaskDto,
  ) {
    return {
      subtask: await this.tasksService.updateSubtask(
        authUser,
        id,
        updateSubtaskDto,
      ),
    };
  }

  @Post(':id/participants/:userId')
  @HttpCode(HttpStatus.CREATED)
  async addParticipant(
    @AuthUser() authUser: User,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return {
      user: await this.tasksService.addParticipant(authUser, +id, +userId),
    };
  }

  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeParticipant(
    @AuthUser() authUser: User,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.tasksService.removeParticipant(authUser, +id, +userId);
  }

  @Post(':id/comments')
  @UseGuards(TaskCollaboratorGuard)
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @AuthUser() authUser: User,
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    addCommentDto: AddCommentDto,
  ) {
    return {
      comment: await this.tasksService.addComment(authUser, +id, addCommentDto),
    };
  }

  @Get(':id/comments')
  @UseGuards(TaskCollaboratorGuard)
  async getComments(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    const [comments, count] = await this.tasksService.getComments(+id, +page);
    return {
      comments,
      count,
      totalPages: Math.ceil(count / 10),
      currentPage: page,
      hasNextPage: page * 10 < count,
      hasPreviousPage: page > 1,
    };
  }
}
