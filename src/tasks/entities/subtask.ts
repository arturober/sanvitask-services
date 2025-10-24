import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { Ref } from '@mikro-orm/core';
import { Task } from './task';

@Entity()
export class Subtask {
  @PrimaryKey()
  id!: number;

  @Property({ length: 200, nullable: false })
  description!: string;

  @Property({ nullable: true, default: false })
  completed? = false;

  @ManyToOne(() => Task, 'subtasks')
  task!: Ref<Task>;
}
