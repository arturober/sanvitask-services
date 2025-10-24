import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { ImageService } from 'src/commons/image/image.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly imageService: ImageService,
    @InjectRepository(User) private readonly usersRepo: EntityRepository<User>,
  ) {}

  async getUser(id: number): Promise<User> {
    return this.usersRepo.findOneOrFail({ id });
  }

  async getUserbyEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ email });
  }

  async getUsersByName(name: string): Promise<User[]> {
    return this.usersRepo.find({ name: { $like: '%' + name + '%' } });
  }

  async emailExists(email: string): Promise<boolean> {
    return (await this.usersRepo.findOne({ email })) ? true : false;
  }

  async updateUserInfo(id: number, user: UpdateUserDto): Promise<void> {
    await this.usersRepo.nativeUpdate({ id }, user);
  }

  async updatePassword(id: number, pass: UpdatePasswordDto): Promise<void> {
    await this.usersRepo.nativeUpdate({ id }, pass);
  }

  async updatePhoto(id: number, photoDto: UpdatePhotoDto): Promise<string> {
    photoDto.avatar = await this.imageService.saveImage(
      'users',
      photoDto.avatar,
    );
    await this.usersRepo.nativeUpdate(id, photoDto);
    return photoDto.avatar;
  }
}
