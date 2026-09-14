import app from './app';
import { ensureDemoAccounts } from './bootstrap';
import { config } from './config';
import prisma from './config/prisma';

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Successfully connected to PostgreSQL database via Prisma.');
    await ensureDemoAccounts();

    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`Swagger API Documentation: http://localhost:${config.port}/api/docs`);
      console.log(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
