import { jest } from '@jest/globals';

const mockHostel = { findOne: jest.fn() };
const mockChat = {
  findOne: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};
const mockMessage = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn().mockImplementation(function () { return this }),
};

jest.unstable_mockModule('../models/hostel.model.js', () => ({
  default: mockHostel
}));

jest.unstable_mockModule('../models/chat.model.js', () => ({
  default: mockChat
}));

jest.unstable_mockModule('../models/messages.model.js', () => ({
  default: mockMessage
}));

describe('sendMessage', () => {
  let sendMessage;

  beforeAll(async () => {
    ({ sendMessage } = await import('../controllers/chat.controllers.js'));
  });

  it('should send a message successfully', async () => {
    // Arrange mocks
    const req = {
      user: { _id: '123' },
      body: { recipientId: '456', text: 'Hello!' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockHostel.findOne.mockResolvedValue(null);
    mockChat.findOne.mockResolvedValue(null);
    mockChat.save.mockResolvedValue({ _id: 'chat-id' });

    mockMessage.save.mockResolvedValue({
      text: 'Hello!',
      sender: '123',
      senderModel: 'User',
      chat: 'chat-id',
      createdAt: new Date()
    });

    // Act
    await sendMessage(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
    }));
  });
});
