import Conversation from "../models/conversation.model.js";
import Hostel from "../models/hostel.model.js";
import User from "../models/user.model.js";
import Message from "../models/messages.model.js";
import Guest from "../models/guest.model.js";

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
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });

        let conversations;

        if (!hostel) {
            conversations = await Conversation.find({
                "participants.user": user._id
            })
        } else {
            conversations = await Conversation.find({
                "participants.hostel": hostel._id
            })
        }

        const results = await Promise.all(conversations.map(async (conversation) => {
            const lastMessage = await Message.findOne({ conversation: conversation._id })
                .sort({ createdAt: -1 });

            const other = conversation.participants.find(p => {
                return (
                    (p.user && p.user.toString() !== user._id.toString()) ||
                    (p.hostel && hostel && p.hostel.toString() !== hostel._id.toString())
                );
            });

            const guest = await Guest.findOne({ user: other.user._id }).select("guestPhotos");
            const firstPhoto = guest?.guestPhotos?.[0] || null;

            let otherData = null;

            if (other?.user) {
                const otherUser = await User.findById(other.user).select("name");
                otherData = {
                    userId: otherUser._id,
                    name: otherUser.name,
                    photo: firstPhoto
                };
            }

            // if (other?.hostel) { ... }

            return {
                conversationId: conversation._id,
                participant: otherData,
                lastMessage: lastMessage
                    ? {
                        text: lastMessage.text,
                        createdAt: lastMessage.createdAt,
                    }
                    : null
            };
        }));
        console.log(results)

        res.status(200).json({
            message: "Get all conversations successfully",
            data: results,
            success: true,
        });

    } catch (error) {
        console.error("Error in getAllConversations controller", error.message);
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