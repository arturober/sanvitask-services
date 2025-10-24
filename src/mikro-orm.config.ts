import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { Dictionary, IPrimaryKey, Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { NotFoundException } from '@nestjs/common';
import type { Database } from 'better-sqlite3';

type FindOneOrFailHandler = (
  entityName: string,
  where: Dictionary | IPrimaryKey,
) => Error;

const findOneOrFailHandler: FindOneOrFailHandler = (entityName, where) => {
  throw new NotFoundException(
    `${entityName} not found with the following criteria: ${JSON.stringify(where)}`,
  );
};

const mikroOrmConfig: Options = {
  entities: ['./dist/**/*.entity.js'], // Rutas de entidades compiladas
  entitiesTs: ['./src/**/*.entity.ts'], // Rutas de entidades en TypeScript
  dbName: 'sanvitask.sqlite', // Nombre de la base de datos SQLite
  driver: BetterSqliteDriver,
  debug: true, // Activar logs en desarrollo
  findOneOrFailHandler: findOneOrFailHandler,
  allowGlobalContext: true, // Permitir contexto global (útil para `SchemaGenerator` en aplicaciones pequeñas)
  metadataProvider: TsMorphMetadataProvider,
  pool: {
    afterCreate: (conn: Database, done) => {
      // Accede al método `function` del objeto de la base de datos de better-sqlite3
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      conn.function(
        'haversine',
        { deterministic: true },
        (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const toRad = (x: number) => (x * Math.PI) / 180;
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const R = 6371; // radio de la Tierra en km
          return R * c;
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      done(null, conn);
    },
  },
};

export default mikroOrmConfig;
