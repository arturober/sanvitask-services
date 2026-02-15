import { Inject, Injectable } from '@nestjs/common';

import { ImageService } from '../commons/image/image.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { EntityRepository, RequiredEntityData } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/users/entities/user.entity';
import { UserService } from 'src/users/user.service';
import { URLSearchParams } from 'url';
import { LoginTokenDto } from './dto/login-token.dto';
import { RegisterResponse } from './interfaces/register-response';
import { TokenResponse } from './interfaces/token-response';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('GOOGLE_ID') private googleId: string,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly imageService: ImageService,
    private readonly usersService: UserService,
  ) {}

  private createToken(user: User): TokenResponse {
    const data: JwtPayload = {
      id: user.id,
    };
    const accessToken = this.jwtService.sign(data);
    return { accessToken };
  }

  async registerUser(userDto: RegisterUserDto): Promise<RegisterResponse> {
    userDto.avatar = await this.imageService.saveImage('users', userDto.avatar);
    await this.userRepo.insert(userDto);
    return { email: userDto.email };
  }

  async login(userDto: LoginUserDto): Promise<TokenResponse> {
    const user = await this.userRepo.findOneOrFail({
      email: userDto.email,
      password: userDto.password,
    });
    if (userDto.firebaseToken) {
      user.firebaseToken = userDto.firebaseToken;
    }
    if (userDto.lat && userDto.lng) {
      user.lat = userDto.lat;
      user.lng = userDto.lng;
    }
    await this.userRepo.getEntityManager().flush();
    return this.createToken(user);
  }

  async loginGoogle(tokenDto: LoginTokenDto): Promise<TokenResponse> {
    const client = new OAuth2Client(this.googleId);
    const ticket = await client.verifyIdToken({
      idToken: tokenDto.token,
      audience: this.googleId,
    });
    const payload = ticket.getPayload()!;
    const email = payload.email!;
    let user = await this.usersService.getUserbyEmail(email);

    if (!user) {
      const avatar = await this.imageService.downloadImage(
        'users',
        payload.picture!,
      );
      const user2: RequiredEntityData<User> = {
        email,
        name: payload.name ?? 'Unknown',
        avatar,
        lat: tokenDto.lat ?? 0,
        lng: tokenDto.lng ?? 0,
      };
      await this.userRepo.insert(user2);
      user = (await this.usersService.getUserbyEmail(email))!;
    }

    if (tokenDto.firebaseToken) {
      user.firebaseToken = tokenDto.firebaseToken;
    }

    if (tokenDto.lat && tokenDto.lng) {
      user.lat = tokenDto.lat;
      user.lng = tokenDto.lng;
    }
    await this.userRepo.getEntityManager().flush();

    return this.createToken(user);
  }

  async loginFacebook(tokenDto: LoginTokenDto): Promise<TokenResponse> {
    const resp = await axios.get('https://graph.facebook.com/me', {
      params: {
        access_token: tokenDto.token,
        fields: 'id,name,email',
      },
    });

    const respUser = resp.data as { id: string; name: string; email: string };

    let user = await this.usersService.getUserbyEmail(respUser.email);

    if (!user) {
      const paramsImg = new URLSearchParams({
        access_token: tokenDto.token,
        type: 'large',
      });
      const respImg = (
        await axios.get('https://graph.facebook.com/me/picture', {
          params: paramsImg.toString(),
        })
      ).data as BinaryType;
      const avatar = await this.imageService.saveImageBinary('users', respImg);
      const user2: RequiredEntityData<User> = {
        email: respUser.email,
        name: respUser.name,
        avatar,
        lat: tokenDto.lat ?? 0,
        lng: tokenDto.lng ?? 0,
      };
      await this.userRepo.insert(user2);
      user = (await this.usersService.getUserbyEmail(respUser.email))!;
    }

    if (tokenDto.firebaseToken) {
      user.firebaseToken = tokenDto.firebaseToken;
    }

    if (tokenDto.lat && tokenDto.lng) {
      user.lat = tokenDto.lat;
      user.lng = tokenDto.lng;
    }
    await this.userRepo.getEntityManager().flush();

    return this.createToken(user);
  }

  async logout(authUser: User) {
    authUser.firebaseToken = null;
    await this.userRepo.upsert(authUser);
  }
}
