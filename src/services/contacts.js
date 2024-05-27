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

export const updateContact = async (id, payload) => {
  const rawResult = await Contact.findOneAndUpdate({
    _id: id,
  }, payload);

  // if (!rawResult || !rawResult.value) return null;

  return {
    contact: rawResult.value,
  };
};
