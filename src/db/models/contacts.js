import { Schema, model } from 'mongoose';

const contactsSchema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: false },
    isFavourite: { type: Boolean, default: false },
    contactType: { type: String, enum: ['work', 'home', 'personal'] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Contact = model('contacts', contactsSchema);
