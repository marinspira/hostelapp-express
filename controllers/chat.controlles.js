import Chat from "../models/chat.model.js";
import Hostel from "../models/hostel.model.js";
import User from "../models/user.model.js";
import Message from "../models/messages.model.js";
import Guest from "../models/guest.model.js";

export const sendMessage = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });

        const { chatId, text, recipientId } = req.body;

        let chat;

        if (!chatId) {
            if (hostel) {
                chat = await Chat.findOne({
                    $and: [
                        { participants: { $elemMatch: { hostel: hostel._id } } },
                        { participants: { $elemMatch: { user: recipientId } } }
                    ]
                });
                if (!chat) {
                    chat = new Chat({
                        participants: [
                            { hostel: hostel._id },
                            { user: recipientId }
                        ]
                    });

                    await chat.save();
                }
            } else {
                chat = await Chat.findOne({
                    $and: [
                        { participants: { $elemMatch: { user: user._id } } },
                        { participants: { $elemMatch: { user: recipientId } } }
                    ]
                });

                if (!chat) {
                    chat = new Chat({
                        participants: [
                            { user: user._id },
                            { user: recipientId }
                        ]
                    });
                    await chat.save();
                }
            }
        } else {
            chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(400).json({
                    message: "Chat not found",
                    success: false,
                });
            }
        }

        const message = new Message({
            chat: chat._id,
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

export const getAllChats = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });

        let chats;

        if (!hostel) {
            chats = await Chat.find({
                "participants.user": user._id
            })
        } else {
            chats = await Chat.find({
                "participants.hostel": hostel._id
            })
        }

        const results = await Promise.all(chats.map(async (chat) => {
            const lastMessage = await Message.findOne({ chat: chat._id })
                .sort({ createdAt: -1 });

            let other = null

            if (!hostel) {
                if (chat.participants.length !== 2) return null;

                const found = chat.participants.find(p => {
                    return (
                        (p.user && p.user.toString() !== user._id.toString()) ||
                        (p.hostel)
                    );
                });

                if (found?.user) {
                    other = { id: found.user, type: "user" };
                } else if (found?.hostel) {
                    other = { id: found.hostel, type: "hostel" };
                }
            } else {
                if (chat.participants.length !== 2) return null;

                const found = chat.participants.find(p => {
                    return (p.user && p.user.toString() !== user._id.toString());
                });

                if (found) {
                    other = { id: found.user, type: "user" };
                }
            }

            if (!other) return null;
            let otherData = null;

            if (other.type === "user") {
                const guest = await Guest.findOne({ user: other.id }).select("guestPhotos");
                const firstPhoto = guest?.guestPhotos?.[0] || null;
                const otherUser = await User.findById(other.id).select("name");

                otherData = {
                    userId: otherUser._id,
                    name: otherUser.name,
                    photo: firstPhoto
                };
            } else if (other.type === "hostel") {
                const hostelData = await Hostel.findById(other.id).select("name photo");
                otherData = {
                    userId: hostelData._id,
                    name: hostelData.name,
                    photo: hostelData.photo || null
                };
            }

            return {
                chatId: chat._id,
                participant: otherData,
                lastMessage: lastMessage
                    ? {
                        text: lastMessage.text,
                        createdAt: lastMessage.createdAt,
                    }
                    : null
            };
        }));

        res.status(200).json({
            message: "Get all chats successfully",
            data: results,
            success: true,
        });

    } catch (error) {
        console.error("Error in getAllChats controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user
        const limit = 20

        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(200).json({
                message: "Chat not found or not started yet",
                success: true,
                data: []
            });
        }

        const messages = await Message.find({ chat: id })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .exec();

        // TODO v2: alterar sender para hostelId verificacao, para quando o hostel puder ter mais de um owner
        const formattedMessages = messages.map(msg => ({
            text: msg.text,
            time: msg.createdAt,
            sender: msg.sender?.toString() === user._id.toString() ? "me" : "other"
        }));

        res.status(200).json({
            message: "Get all messages successfully",
            data: formattedMessages,
            success: true,
        });

    } catch (error) {
        console.error("Error in getMessages controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};