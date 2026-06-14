import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Context, Handler } from 'aws-lambda';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module';

let cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    nestApp.enableCors({
      origin: (req: unknown, callback: (err: null, allow: boolean) => void) =>
        callback(null, true),
    });
    nestApp.use(helmet());
    await nestApp.init();

    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export const handler = async (event: unknown, context: Context) => {
  const server = await bootstrap();
  return server(event, context, (err: unknown, result: unknown) => {
    if (err) throw err;
    return result;
  });
};
