import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
// import * as admin from 'firebase-admin';
import appConfig from './app.config';
import * as express from 'express';

// const serviceAccount = require('../firebase/firebase_key.json');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(
    '/' + appConfig().basePath + 'img',
    express.static(__dirname + '/../img'),
  );
  app.use(express.json({ limit: '10mb' }));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.setGlobalPrefix(
    appConfig().basePath ? appConfig().basePath.slice(0, -1) : '',
  );
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount),
  // });
  await app.listen(appConfig().port);
}
void bootstrap();
