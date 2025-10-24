import Chat from "../../models/chat.model.js";
import Hostel from "../../models/hostel.model.js";
import User from "../../models/user.model.js";
import mongoose from "mongoose";

/**
 * Inicia uma conversa privada entre um hostel e um guest
 * @param {ObjectId} hostelId - ID do hostel
 * @param {ObjectId} userId - ID do usuário guest
 * @returns {Object} - Chat privado entre hostel e guest
 */
export const initiateHostelGuestChat = async (hostelId, userId) => {
    try {
        // Verifica se o hostel existe
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            throw new Error("Hostel not found");
        }

        // Verifica se o guest existe
        const guest = await User.findById(userId);
        if (!guest) {
            throw new Error("Guest not found");
        }

        // Verifica se já existe um chat privado entre este hostel e guest
        let privateChat = await Chat.findOne({
            $and: [
                { participants: { $elemMatch: { hostel: hostelId } } },
                { participants: { $elemMatch: { user: userId } } },
                { group: false }
            ]
        });

        // Se não existe, cria um novo chat privado
        if (!privateChat) {
            const participants = [
                { hostel: new mongoose.Types.ObjectId(hostelId) },
                { user: new mongoose.Types.ObjectId(userId) }
            ];

            privateChat = new Chat({
                participants: participants,
                group: false,
                createdAt: new Date(),
            });

            await privateChat.save();
            console.log(`Created new private chat between hostel ${hostel.name} and guest ${guest.email}`);
        } else {
            console.log(`Private chat already exists between hostel ${hostel.name} and guest ${guest.email}`);
        }

        return privateChat;
    } catch (error) {
        console.error("Error initiating hostel-guest chat:", error);
        throw error;
    }
};

/**
 * Inicia uma conversa privada entre dois guests
 * @param {ObjectId} guestUserId1 - ID do primeiro usuário guest
 * @param {ObjectId} guestUserId2 - ID do segundo usuário guest
 * @returns {Object} - Chat privado entre os dois guests
 */
export const initiateGuestToGuestChat = async (guestUserId1, guestUserId2) => {
    try {
        // Verifica se os IDs são diferentes
        if (guestUserId1.toString() === guestUserId2.toString()) {
            throw new Error("Cannot create chat with the same user");
        }

        // Verifica se ambos os guests existem
        const [guest1, guest2] = await Promise.all([
            User.findById(guestUserId1),
            User.findById(guestUserId2)
        ]);

        if (!guest1) {
            throw new Error("First guest not found");
        }

        if (!guest2) {
            throw new Error("Second guest not found");
        }

        // Verifica se já existe um chat privado entre estes dois guests
        // Precisamos verificar ambas as ordens de participantes
        let privateChat = await Chat.findOne({
            $and: [
                {
                    $or: [
                        {
                            $and: [
                                { participants: { $elemMatch: { user: guestUserId1 } } },
                                { participants: { $elemMatch: { user: guestUserId2 } } }
                            ]
                        }
                    ]
                },
                { group: false },
                { participants: { $size: 2 } }, // Garante que são apenas 2 participantes
                { participants: { $not: { $elemMatch: { hostel: { $exists: true } } } } } // Garante que não há hostels
            ]
        });

        // Se não existe, cria um novo chat privado
        if (!privateChat) {
            const participants = [
                { user: new mongoose.Types.ObjectId(guestUserId1) },
                { user: new mongoose.Types.ObjectId(guestUserId2) }
            ];

            privateChat = new Chat({
                participants: participants,
                group: false,
                createdAt: new Date(),
            });

            await privateChat.save();
            console.log(`Created new private chat between guests ${guest1.username || guest1.email} and ${guest2.username || guest2.email}`);
        } else {
            console.log(`Private chat already exists between guests ${guest1.username || guest1.email} and ${guest2.username || guest2.email}`);
        }

        return privateChat;
    } catch (error) {
        console.error("Error initiating guest-to-guest chat:", error);
        throw error;
    }
};

/**
 * Busca todos os chats privados de um usuário
 * @param {ObjectId} userId - ID do usuário
 * @returns {Array} - Array de chats privados do usuário
 */
export const getUserPrivateChats = async (userId) => {
    try {
        const privateChats = await Chat.find({
            $and: [
                { participants: { $elemMatch: { user: userId } } },
                { group: false }
            ]
        }).populate('participants.user', 'username email profilePicture')
          .populate('participants.hostel', 'name location profilePicture')
          .sort({ updatedAt: -1 });

        return privateChats;
    } catch (error) {
        console.error("Error fetching user private chats:", error);
        throw error;
    }
};

/**
 * Busca todos os chats privados de um hostel
 * @param {ObjectId} hostelId - ID do hostel
 * @returns {Array} - Array de chats privados do hostel
 */
export const getHostelPrivateChats = async (hostelId) => {
    try {
        const privateChats = await Chat.find({
            $and: [
                { participants: { $elemMatch: { hostel: hostelId } } },
                { group: false }
            ]
        }).populate('participants.user', 'username email profilePicture')
          .populate('participants.hostel', 'name location profilePicture')
          .sort({ updatedAt: -1 });

        return privateChats;
    } catch (error) {
        console.error("Error fetching hostel private chats:", error);
        throw error;
    }
};
