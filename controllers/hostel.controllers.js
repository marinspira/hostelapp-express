
export const createHostel = async (req, res) => {
    try {
        console.log(req.user)

        // gerar usuário

        // salvar no banco de dados

        return res.status(200).json({
            message: 'Guest retrieved successfully',
            success: true,
            data: {
                
            }
        })

    } catch (error) {
        console.error("Error in createHostel controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}