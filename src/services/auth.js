import createHttpError from 'http-errors';
import { usersCollection } from '../db/models/users.js';
import bcrypt from 'bcrypt';
import { sessionsCollection } from '../db/models/session.js';
import { randomBytes } from 'crypto';
import {
  FIFTEEN_MINUTES,
  SMTP,
  TEMPLATES_DIR,
  THIRTY_DAYS,
} from '../constants/index.js';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendEmail.js';
import path from 'path';
import fs from 'node:fs/promises';
import handlebars from 'handlebars';

export const registerUser = async (payload) => {
  const user = await usersCollection.findOne({
    email: payload.email,
  });

  if (user) {
    throw createHttpError(409, 'Email in use');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  return await usersCollection.create({
    ...payload,
    password: encryptedPassword,
  });
};

export const loginUser = async (payload) => {
  const user = await usersCollection.findOne({
    email: payload.email,
  });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const isEqual = await bcrypt.compare(payload.password, user.password);

  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized');
  }

  await sessionsCollection.deleteOne({ userId: user._id });

  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return sessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
};

export const logoutUser = async (sessionId) => {
  await sessionsCollection.deleteOne({ _id: sessionId });
};

const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  };
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
  const session = await sessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }
  const newSession = createSession();

  return await sessionsCollection.create({
    userId: session.userId,
    ...newSession,
  });
};

export const requestResetToken = async (email) => {
  const user = await usersCollection.findOne({ email });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    env('JWT_SECRET'),
    {
      expiresIn: '15m',
    },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${env('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  await sendEmail({
    from: env(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
  });
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, env('JWT_SECRET'));
  } catch (err) {
    if (err instanceof Error) throw createHttpError(401, err.message);
    throw err;
  }

  const user = await usersCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await usersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};
