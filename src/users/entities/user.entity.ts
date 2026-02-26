import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Exclude } from 'class-transformer';
import { Task } from '../../tasks/entities/task';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ length: 200, nullable: false })
  name!: string;

  @Property({ length: 250, nullable: false })
  email!: string;

  @Property({ length: 100, nullable: true, hidden: true })
  @Exclude({ toPlainOnly: true })
  password?: string;

  @Property({
    length: 250,
    nullable: false,
    serializer: (p: string) => {
      const baseUrl =
        (process.env.BASE_URL || 'http://localhost:3000') +
        (process.env.BASE_PATH || '');
      return `${baseUrl}/${p}`;
    },
  })
  avatar!: string;

  @Property({ columnType: 'double', nullable: true, default: 0 })
  lat = 0;

  @Property({ columnType: 'double', nullable: true, default: 0 })
  lng = 0;

  @Property({ length: 200, nullable: true, hidden: true })
  @Exclude({ toPlainOnly: true })
  firebaseToken?: string | null;

  @Property({ persist: false })
  me?: boolean;

  @ManyToMany(() => Task, 'participants', { owner: true })
  tasks = new Collection<Task>(this);
}
