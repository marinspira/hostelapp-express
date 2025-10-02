import Chat from "../models/chat.model.js";
import Hostel from "../models/hostel.model.js";
import User from "../models/user.model.js";
import Message from "../models/messages.model.js";
import Guest from "../models/guest.model.js";

// Helper to get sender name/photo for a message
const getSenderName = async (msg) => {
    if (!msg) return null;
    try {
        if (msg.senderModel === 'User') {
            const senderUser = await User.findById(msg.sender).select('name');
            const senderGuest = await Guest.findOne({ user: msg.sender }).select('guestPhotos');
            return senderUser?.name || senderGuest?.guestPhotos?.[0] || null;
        } else if (msg.senderModel === 'Hostel') {
            const senderHostel = await Hostel.findById(msg.sender).select('name');
            return senderHostel?.name || null;
        }
    } catch (err) {
        console.error('Error resolving sender name:', err);
        return null;
    }
}

export const sendMessage = async (req, res) => {
    const user = req.user
    if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
    }
    const hostel = await Hostel.findOne({ user_id_owners: user._id });

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
};

export const getAllChats = async (req, res) => {
    const user = req.user
    if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
    }
    const hostel = await Hostel.findOne({ user_id_owners: user._id });

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

        // Se é um chat de grupo
        if (chat.group) {
            if (!hostel) {
                // Para guests: buscar o hostel do grupo
                const hostelParticipant = chat.participants.find(p => p.hostel);
                if (hostelParticipant) {
                    const hostelData = await Hostel.findById(hostelParticipant.hostel).select("name logo");
                    if (!hostelData) return null;
                    return {
                        chatId: chat._id,
                        conversationId: chat._id,
                        isGroup: true,
                        participant: {
                            userId: hostelData._id,
                            name: `${hostelData.name}`,
                            photo: hostelData.logo || hostelData.photo || null,
                        },
                        lastMessage: lastMessage
                            ? {
                                  text: lastMessage.text,
                                  createdAt: lastMessage.createdAt,
                                  senderName: await getSenderName(lastMessage),
                              }
                            : null,
                    };
                }
                return null;
            } else {
                // Para hostels: mostrar o chat de grupo com seus guests
                const guestCount = chat.participants.filter(p => p.user).length;
                
                return {
                    chatId: chat._id,
                    conversationId: chat._id,
                    isGroup: true,
                    participant: {
                        userId: hostel._id,
                        name: `Group Chat (${guestCount} guests)`,
                        photo: hostel.logo || hostel.photo || null
                    },
                    lastMessage: lastMessage
                        ? {
                            text: lastMessage.text,
                            createdAt: lastMessage.createdAt,
                            senderName: await getSenderName(lastMessage),
                        }
                        : null
                };
            }
        }

        // Chat individual (código original)
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
            if (!otherUser) return null;

            otherData = {
                userId: otherUser._id,
                name: otherUser.name,
                photo: firstPhoto,
            };
        } else if (other.type === "hostel") {
            const hostelData = await Hostel.findById(other.id).select("name logo");
            if (!hostelData) return null;
            otherData = {
                userId: hostelData._id,
                name: hostelData.name,
                photo: hostelData.logo || null,
            };
        }

        return {
            chatId: chat._id,
            conversationId: chat._id,
            isGroup: false,
            participant: otherData,
            lastMessage: lastMessage
                ? {
                    text: lastMessage.text,
                    createdAt: lastMessage.createdAt,
                }
                : null
        };
    }));
    // Remove null or empty results (e.g. deleted chats or malformed entries)
    const filtered = results.filter(r => r && r.participant && r.participant.name);

    res.status(200).json({
        message: "Get all chats successfully",
        data: filtered,
        success: true,
    });
};

export const getMessages = async (req, res) => {
    const { id } = req.params;
    const user = req.user
    if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
    }
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
        .populate('sender')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .exec();

    // Check if user is part of hostel
    const hostel = await Hostel.findOne({ user_id_owners: user._id });
    const isGroup = chat.group;

    // TODO v2: change sender to hostelId verification, for when hostel have more than one owner
    const formattedMessages = await Promise.all(messages.map(async (msg) => {
        const isMyMessage = msg.sender?._id?.toString() === user._id.toString();
        let senderInfo = null;

        // If it's a group chat and not my message, get sender information
        if (isGroup && !isMyMessage) {
            if (msg.senderModel === 'User') {
                const senderUser = await User.findById(msg.sender._id).select('name');
                const senderGuest = await Guest.findOne({ user: msg.sender._id }).select('guestPhotos');
                
                senderInfo = {
                    name: senderUser?.name || 'Unknown',
                    photo: senderGuest?.guestPhotos?.[0] || null
                };
            } else if (msg.senderModel === 'Hostel') {
                const senderHostel = await Hostel.findById(msg.sender._id).select('name logo');
                
                senderInfo = {
                    name: senderHostel?.name || 'Unknown',
                    photo: senderHostel?.logo || null
                };
            }
        }

        return {
            text: msg.text,
            time: msg.createdAt,
            sender: isMyMessage ? "me" : "other",
            senderName: senderInfo?.name || null,
            senderPhoto: senderInfo?.photo || null
        };
    }));

    res.status(200).json({
        message: "Get all messages successfully",
        data: formattedMessages,
        isGroup: isGroup,
        success: true,
    });
};