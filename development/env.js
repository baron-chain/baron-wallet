import path from 'path';
import dotenv from 'dotenv';
import { format } from 'date-fns';
//BCMOD [ERR#1811]
const loadEnvFile = (fileName: string): dotenv.DotenvConfigOutput => {
  return dotenv.config({
    path: path.resolve(__dirname, '..', fileName),
  });
};

const envFiles = ['.env', '.env.version', '.env.expo'];

const results = envFiles.map(loadEnvFile);

if (process.env.NODE_ENV !== 'production') {
  process.env.BUILD_NUMBER =
    process.env.BUILD_NUMBER || `${format(new Date(), 'MMddHHmm')}-dev`;
}

const errorResult = results.find((result) => result.error);

if (errorResult && errorResult.error) {
  console.error('Error loading environment variables:', errorResult.error.message);
  throw errorResult.error;
}

export {};
