import { NestFactory } from "@nestjs/core";
import { App } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

export async function create() {
    const app = await NestFactory.create(App);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        })
    );
    return app;
}

export * from './app.module';
