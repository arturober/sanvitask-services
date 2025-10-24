import {
  PrimaryKey,
  Property,
  ManyToOne,
  type Ref,
  Entity,
} from '@mikro-orm/core';
import { User } from '../../users/entities/user.entity';
import { Task } from './task';

@Entity()
export class TaskComment {
  @PrimaryKey({ fieldName: 'id', type: 'number' })
  id!: number;

  @Property({ length: 200, nullable: false })
  comment!: string;

  @ManyToOne(() => Task, 'comments')
  task!: Ref<Task>;

  @ManyToOne(() => User)
  user!: Ref<User>;

  @Property({
    nullable: true,
    type: 'datetime',
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date = new Date();
}
