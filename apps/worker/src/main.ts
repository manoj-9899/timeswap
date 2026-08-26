import { WorkerModule } from './worker.module.js';

async function bootstrap() {
  console.log('Starting TimeSwap Background Worker Daemon...');
  await WorkerModule.init();
}

bootstrap();
