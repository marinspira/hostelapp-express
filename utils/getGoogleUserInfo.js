// Função para buscar dados do usuário no Google API
export async function getGoogleUserInfo(token) {
    try {
        const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user info');
        return await response.json();
    } catch (error) {
        console.error('Error fetching Google user info:', error);
        throw error;
    }
}