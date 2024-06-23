import path from 'node:path';
import fs from 'node:fs/promises';
import { ENV_VARS, UPLOAD_DIR } from '../constants/index.js';
import { env } from './env.js';

export const saveFileToUploadDir = async (file) => {
  const content = await fs.readFile(file.path);
  const newPath = path.join(UPLOAD_DIR, file.filename);

  await fs.writeFile(newPath, content);
  await fs.unlink(file.path);

  return env(ENV_VARS.APP_DOMAIN) + `/uploads/${file.filename}`;
};
