import Conversation from "../models/conversation.model.js";
import Hostel from "../models/hostel.model.js";
import Message from "../models/messages.model.js";

export const sendMessage = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });

        const { conversationId, text, recipientId } = req.body;

        let conversation;

        if (!conversationId) {
            if (hostel) {
                conversation = await Conversation.findOne({
                    $and: [
                        { participants: { $elemMatch: { hostel: hostel._id } } },
                        { participants: { $elemMatch: { user: recipientId } } }
                    ]
                });
                if (!conversation) {
                    conversation = new Conversation({
                        participants: [
                            { hostel: hostel._id },
                            { user: recipientId }
                        ]
                    });

                    await conversation.save();
                }
            } else {
                conversation = await Conversation.findOne({
                    $and: [
                        { participants: { $elemMatch: { user: user._id } } },
                        { participants: { $elemMatch: { user: recipientId } } }
                    ]
                });

                if (!conversation) {
                    conversation = new Conversation({
                        participants: [
                            { user: user._id },
                            { user: recipientId }
                        ]
                    });
                    await conversation.save();
                }
            }
        } else {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({
                    message: "Conversation not found",
                    success: false,
                });
            }
        }

        const message = new Message({
            conversation: conversation._id,
            sender: user._id,
            senderModel: hostel ? 'Hostel' : 'User',
            text
        });

        const savedMessage = await message.save();

        res.status(201).json({
            message: "Mensage sent!",
            success: true,
            data: savedMessage,
        });
    } catch (error) {
        console.error("Error in sendMessage controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllConversations = async (req, res) => {
    try {
        const userId = req.user
        const hostel = await Hostel.findOne({ owners: userId });

        let conversations;

        if (!hostel) {
            conversations = await Conversation.find({ user: userId })

        } else {
            conversations = await Conversation.find({ hostel: hostel._id })
                .populate({
                    path: "user",
                    match: { role: "guest" },
                    select: "username photo email"
                })
                .sort({ updatedAt: -1 });
        }

        console.log(conversations)

        const results = await Promise.all(
            conversations.map(async (conversation) => {
                const lastMessage = await Message.findOne({ conversation: conversation._id })
                    .sort({ createdAt: -1 });

                return {
                    _id: conversation._id,
                    user: {
                        _id: conversation.user?._id,
                        username: conversation.user?.username,
                        photo: conversation.user?.photo || null,
                        email: conversation.user?.email
                    },
                    lastMessage: lastMessage
                        ? {
                            text: lastMessage.text,
                            createdAt: lastMessage.createdAt,
                        }
                        : null
                };
            })
        );

        console.log("results: ", results)

        res.status(200).json({ conversations: results.filter(c => c.user._id) });

    } catch (error) {
        ror("Error in getAllConversations controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId, limit = 20, before } = req.query;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversa não encontrada!" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .exec();

        res.status(200).json({ messages: messages.reverse() });
    } catch (error) {
        console.error("Erro ao obter mensagens", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};