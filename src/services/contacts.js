import createHttpError from 'http-errors';
import { Contact } from '../db/models/contacts.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/index.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filter = {},
  userId,
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = Contact.find({ userId });

  if (filter.contactType) {
    contactsQuery.where('contactType').equals(filter.contactType);
  }

  if (typeof filter.isFavourite === 'boolean') {
    contactsQuery.where('isFavourite').equals(filter.isFavourite);
  }

  const [contactsCount, contacts] = await Promise.all([
    Contact.find().merge(contactsQuery).countDocuments(),
    Contact.find()
      .merge(contactsQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .exec(),
  ]);

  if (contactsCount === 0) {
    throw createHttpError(404, 'Contact not found for the given params!');
  }

  const paginationData = calculatePaginationData(contactsCount, perPage, page);

  return {
    data: contacts,
    ...paginationData,
  };
};

export const getContactById = async (id, userId) => {
  return await Contact.findOne({ _id: id, userId });
};

export const createContact = async (payload, userId) => {
  const contactData = {
    ...payload,
    userId,
  };

  return await Contact.create(contactData);
};

export const deleteContact = async (id, userId) => {
  const contact = await Contact.findOneAndDelete({
    _id: id,
    userId,
  });
  return contact;
};

export const updateContact = async (id, payload, userId, options = {}) => {
  const rawResult = await Contact.findOneAndUpdate(
    {
      _id: id,
      userId,
    },
    payload,
    {
      new: true,
      includeResultMetadata: true,
      ...options,
    },
  );

  if (!rawResult || !rawResult.value) {
    throw createHttpError(404, 'Contact not found');
  }

  return {
    contact: rawResult.value,
    isNew: Boolean(rawResult?.lastErrorObject?.upserted),
  };
};
