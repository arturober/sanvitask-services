import {
  Cascade,
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  type Ref,
} from '@mikro-orm/core';
import { User } from '../../users/entities/user.entity';
import { Subtask } from './subtask';
import { TaskComment } from './task_comment';

export enum TaskStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
}

@Entity()
export class Task {
  @PrimaryKey()
  id!: number;

  @Property({ length: 200, nullable: false })
  title!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ nullable: true, default: TaskStatus.PENDING })
  status?: number = TaskStatus.PENDING;

  @ManyToMany(() => User, (user) => user.tasks, {
    cascade: [Cascade.ALL],
    deleteRule: 'cascade',
  })
  participants = new Collection<User>(this);

  @ManyToOne(() => User, { nullable: true })
  creator: Ref<User>;

  @Property({
    length: 250,
    nullable: true,
    serializer: (p: string) => {
      const baseUrl =
        (process.env.BASE_URL || 'http://localhost:3000') +
        (process.env.BASE_PATH || '');
      return p ? `${baseUrl}/${p}` : p;
    },
  })
  filepath?: string;

  @Property({
    fieldName: 'created_at',
    type: 'datetime',
    onCreate: () => new Date(),
    index: true,
  })
  createdAt?: Date = new Date();

  @Property({ nullable: true })
  deadLine?: Date;

  @Property({ columnType: 'double', nullable: true, default: 0 })
  lat?: number = 0;

  @Property({ columnType: 'double', nullable: true, default: 0 })
  lng?: number = 0;

  @Property({ length: 250, nullable: true })
  address?: string;

  @OneToMany(() => Subtask, (subtask) => subtask.task, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  subtasks = new Collection<Subtask>(this);

  @Property({ type: 'integer' })
  position!: number;

  @Property({ persist: false })
  mine?: boolean;

  @OneToMany(() => TaskComment, (comment) => comment.task, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  comments = new Collection<TaskComment>(this);
}
