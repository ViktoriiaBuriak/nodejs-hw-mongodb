import createHttpError from 'http-errors';
import { Contact } from '../db/models/contacts.js';

export const getAllContacts = async () => {
  return await Contact.find();
};

export const getContactById = async (id) => {
  return await Contact.findById(id);
};

export const createContact = async (payload) => {
  return await Contact.create(payload);
};

export const deleteContact = async (id) => {
  const contact = await Contact.findOneAndDelete({
    _id: id,
  });
  return contact;
};

export const updateContact = async (id, payload, options = {}) => {
  const rawResult = await Contact.findOneAndUpdate({
    _id: id,
  }, payload,
    {
      new: true,
      includeResultMetadata: true,
      ...options
  });

  if (!rawResult || !rawResult.value) {
    throw createHttpError(404, 'Contact not found');
  }

  return {
    contact: rawResult.value,
    isNew: Boolean(rawResult?.lastErrorObject?.upserted)
  };
};
