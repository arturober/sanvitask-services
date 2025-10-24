import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import { AuthUser } from 'src/auth/decorators/user.decorator';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('me')
  getCurrentUser(@AuthUser() authUser: User) {
    authUser.me = true;
    return { user: authUser };
  }

  @Get('name/:name')
  async getUsersByName(
    @AuthUser() authUser: User,
    @Param('name') name: string,
  ) {
    const users = await this.usersService.getUsersByName(name);
    return { users };
  }

  @Get(':id')
  async getUser(
    @AuthUser() authUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const user = await this.usersService.getUser(id);
      user.me = id === authUser.id;
      return { user };
    } catch {
      throw new NotFoundException();
    }
  }

  @Put('me')
  @HttpCode(204)
  async updateUserInfo(
    @AuthUser() authUser: User,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    userDto: UpdateUserDto,
  ): Promise<void> {
    try {
      await this.usersService.updateUserInfo(authUser.id, userDto);
    } catch (error) {
      const e = error as { code: string };
      if (e.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('This email is already registered');
      } else {
        throw new NotFoundException();
      }
    }
  }

  @Put('me/password')
  @HttpCode(204)
  async updatePassword(
    @AuthUser() authUser: User,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    passDto: UpdatePasswordDto,
  ): Promise<void> {
    try {
      await this.usersService.updatePassword(authUser.id, passDto);
    } catch {
      throw new NotFoundException();
    }
  }

  @Put('me/avatar')
  async updateAvatar(
    @AuthUser() authUser: User,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    photoDto: UpdatePhotoDto,
  ) {
    try {
      const avatar = await this.usersService.updatePhoto(authUser.id, photoDto);
      const baseUrl =
        (process.env.BASE_URL || 'http://localhost:3000') +
        (process.env.BASE_PATH || '');
      return { avatar: baseUrl + '/' + avatar };
    } catch {
      throw new NotFoundException();
    }
  }
}
