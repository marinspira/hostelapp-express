import Message from "../models/message.model.js";
import Conversation from '../models/conversation.models.js'

export const saveMessage = async (req) => {
    try {
        const userId = req.user._id
        const message = req.body

        // Buscar ou criar a conversa
        let conversation = await Conversation.findOne({ participants: { $all: [userId, "outro_usuario_id"] } });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, "outro_usuario_id"]
            });
        }

        const newMessage = new Message({
            text: message.text,
            senderId: userId,
            conversationId: conversation._id,
        });

        // Atualizar a última mensagem da conversa
        conversation.lastMessage = message._id;
        await conversation.save();

        res.status(201).json(message);

        await newMessage.save();
        return newMessage;

    } catch (error) {
        console.error("Erro ao salvar mensagem:", error);
    }
}

export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
};