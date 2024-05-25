import mongoose from 'mongoose';
import { env } from '../utils/env.js';
import { envVars } from '../constants/envVars.js';

export const initMongoConnection = async () => {
  const connectionLink = `mongodb+srv://${env(envVars.MONGODB_USER)}:${env(
    envVars.MONGODB_PASSWORD,
  )}@${env(envVars.MONGODB_URL)}/${env(
    envVars.MONGODB_DB,
  )}?retryWrites=true&w=majority&appName=Cluster0`;

  try {
    await mongoose.connect(connectionLink);
    console.log('Mongo connection successfully established!');
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};
