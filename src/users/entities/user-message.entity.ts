import { ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { User } from './user.entity';

export class UserMessage {
  @PrimaryKey({ fieldName: 'id', type: 'number' })
  id!: number;

  @Property({ fieldName: 'content', type: 'string', length: 500 })
  content!: string;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Property({ fieldName: 'created_at', type: 'Date' })
  createdAt = new Date();

  constructor(content: string, user: User) {
    this.content = content;
    this.user = user;
  }
}
