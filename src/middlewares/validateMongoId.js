import createHttpError from 'http-errors';
import { isValidObjectId } from 'mongoose';

export const validateMongoId =
  (idName = 'id') =>
  (req, res, next) => {
    const id = req.params[idName];

    if (!id) {
      throw new Error('ID is not provided!');
    }

    if (!isValidObjectId(id)) {
      return next(createHttpError(400, `Invalid contact ID: ${id}`));
    }

    return next();
  };
