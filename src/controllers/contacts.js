import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  updateContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
    userId: req.user._id,
  });
  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res, next) => {
  const id = req.params.contactId;
  const userId = req.user._id;

  const contact = await getContactById(id, userId);

  if (!contact) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  const userId = req.user._id;
  const contact = await createContact(req.body, userId);

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const deleteContactController = async (req, res, next) => {
  const id = req.params.contactId;
  const userId = req.user._id;

  const contact = await deleteContact(id, userId);

  if (!contact) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  res.status(204).send();
};

export const patchContactController = async (req, res) => {
  const id = req.params.contactId;
  const userId = req.user._id;

  const result = await updateContact(id, req.body, userId);

  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: result.contact,
  });
};

export const putContactController = async (req, res) => {
  const id = req.params.contactId;
  const userId = req.user._id;

  const result = await updateContact(id, req.body, userId, {
    upsert: true,
  });

  const status = result.isNew ? 201 : 200;

  res.json({
    status: status,
    message: 'Successfully upserted a contact!',
    data: result.contact,
  });
};
