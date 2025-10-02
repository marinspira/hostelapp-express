import Chat from "../../models/chat.model.js";
import Hostel from "../../models/hostel.model.js";
import mongoose from "mongoose";

/**
 * Garante que existe um chat de grupo para o hostel e adiciona todos os guests associados
 * @param {ObjectId} hostelId - ID do hostel
 * @returns {Object} - Chat de grupo do hostel
 */
export const ensureHostelGroupChat = async (hostelId) => {
    try {
        // Busca o hostel com todos os guests
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            throw new Error("Hostel not found");
        }

        // Verifica se já existe um chat de grupo para este hostel
        let groupChat = await Chat.findOne({
            $and: [
                { participants: { $elemMatch: { hostel: hostelId } } },
                { group: true }
            ]
        });

        // Se não existe, cria um novo chat de grupo
        if (!groupChat) {
            const participants = [{ hostel: hostelId }];
            
            // Adiciona todos os guests do hostel como participantes
            if (hostel.user_id_guests && hostel.user_id_guests.length > 0) {
                hostel.user_id_guests.forEach(guestUserId => {
                    participants.push({ user: guestUserId });
                });
            }

            groupChat = new Chat({
                participants: participants,
                group: true,
                createdAt: new Date(),
            });

            await groupChat.save();
            console.log(`Created new group chat for hostel ${hostel.name} with ${participants.length - 1} guests`);
        } else {
            // Se já existe, garante que todos os guests do hostel estão no grupo
            const existingGuestIds = groupChat.participants
                .filter(p => p.user)
                .map(p => p.user.toString());

            const newGuests = hostel.user_id_guests.filter(guestUserId => 
                !existingGuestIds.includes(guestUserId.toString())
            );

            if (newGuests.length > 0) {
                const newParticipants = newGuests.map(guestUserId => ({ user: guestUserId }));
                
                groupChat = await Chat.findByIdAndUpdate(
                    groupChat._id,
                    {
                        $addToSet: {
                            participants: { $each: newParticipants }
                        }
                    },
                    { new: true }
                );

                console.log(`Added ${newGuests.length} new guests to existing group chat for hostel ${hostel.name}`);
            }
        }

        return groupChat;
    } catch (error) {
        console.error("Error ensuring hostel group chat:", error);
        throw error;
    }
};

/**
 * Adiciona um guest específico ao chat de grupo do hostel
 * @param {ObjectId} hostelId - ID do hostel
 * @param {ObjectId} guestUserId - ID do usuário guest
 * @returns {Object} - Chat de grupo atualizado
 */
export const addGuestToHostelGroup = async (hostelId, guestUserId) => {
    try {
        // Primeiro garante que o grupo existe
        let groupChat = await ensureHostelGroupChat(hostelId);

        // Verifica se o guest já está no grupo
        const isAlreadyInGroup = groupChat.participants.some(p => 
            p.user && p.user.toString() === guestUserId.toString()
        );

        if (!isAlreadyInGroup) {
            groupChat = await Chat.findByIdAndUpdate(
                groupChat._id,
                {
                    $addToSet: {
                        participants: { user: new mongoose.Types.ObjectId(guestUserId) }
                    }
                },
                { new: true }
            );

            console.log(`Added guest ${guestUserId} to hostel ${hostelId} group chat`);
        }

        return groupChat;
    } catch (error) {
        console.error("Error adding guest to hostel group:", error);
        throw error;
    }
};

/**
 * Inicializa chats de grupo para todos os hostels existentes
 * Esta função deve ser executada uma vez para garantir que todos os hostels têm grupos
 */
export const initializeAllHostelGroupChats = async () => {
    try {
        const hostels = await Hostel.find({});
        console.log(`Initializing group chats for ${hostels.length} hostels...`);

        const results = [];
        for (const hostel of hostels) {
            try {
                const groupChat = await ensureHostelGroupChat(hostel._id);
                results.push({
                    hostelId: hostel._id,
                    hostelName: hostel.name,
                    groupChatId: groupChat._id,
                    participantCount: groupChat.participants.length - 1, // -1 para não contar o hostel
                    success: true
                });
            } catch (error) {
                results.push({
                    hostelId: hostel._id,
                    hostelName: hostel.name,
                    error: error.message,
                    success: false
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        console.log(`Group chat initialization complete: ${successCount} success, ${errorCount} errors`);
        
        return {
            totalHostels: hostels.length,
            successCount,
            errorCount,
            results
        };
    } catch (error) {
        console.error("Error initializing all hostel group chats:", error);
        throw error;
    }
};

/**
 * Remove um guest do chat de grupo do hostel
 * @param {ObjectId} hostelId - ID do hostel
 * @param {ObjectId} guestUserId - ID do usuário guest
 */
export const removeGuestFromHostelGroup = async (hostelId, guestUserId) => {
    try {
        const groupChat = await Chat.findOne({
            $and: [
                { participants: { $elemMatch: { hostel: hostelId } } },
                { group: true }
            ]
        });

        if (groupChat) {
            await Chat.findByIdAndUpdate(
                groupChat._id,
                {
                    $pull: {
                        participants: { user: guestUserId }
                    }
                }
            );

            console.log(`Removed guest ${guestUserId} from hostel ${hostelId} group chat`);
        }
    } catch (error) {
        console.error("Error removing guest from hostel group:", error);
        throw error;
    }
};