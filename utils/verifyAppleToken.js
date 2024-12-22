import jwt from 'jsonwebtoken';

// Função para obter as chaves públicas da Apple
async function getApplePublicKeys() {
    const response = await fetch('https://appleid.apple.com/auth/keys');

    if (!response.ok) {
        throw new Error('Failed to fetch Apple public keys');
    }

    const data = await response.json();
    return data.keys;
}

// Função para verificar a assinatura do token e a validade
export async function verifyAppleToken(identityToken) {
    try {
        // Decodificar o token
        const decodedToken = jwt.decode(identityToken, { complete: true });
        if (!decodedToken) {
            throw new Error('Invalid token');
        }

        const { header } = decodedToken;

        // Buscar a chave pública da Apple que corresponde ao 'kid' do token
        const publicKeys = await getApplePublicKeys();
        const key = publicKeys.find(k => k.kid === header.kid);
        if (!key) {
            throw new Error('Public key not found');
        }

        // Verificar a assinatura do token usando a chave pública da Apple
        const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.x5c[0]}\n-----END PUBLIC KEY-----`;

        // Verificar a validade do token
        const payload = jwt.verify(identityToken, publicKey, {
            algorithms: ['RS256'],
            audience: 'com.yourapp.client_id',  // Substitua pelo seu client_id
            issuer: 'https://appleid.apple.com',  // Verifica que o token foi emitido pela Apple
        });

        // Se o token for válido, ele será retornado como um objeto de payload
        return payload;

    } catch (error) {
        console.error('Error verifying Apple token:', error.message);
        throw new Error('Invalid or expired token');
    }
}
