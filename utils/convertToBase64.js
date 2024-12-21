import multer from "multer";
import fs from 'fs';

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, './temp/images');
    },
    filename(req, file, callback) {
        callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    },
});

export const upload = multer({ storage });

// Codifica um arquivo em base64
export async function base64Encode(file) {
    // Lê o conteúdo do arquivo especificado usando o módulo fs (file system)
    const body = await fs.promises.readFile(file);
    // Converte o conteúdo do arquivo para uma string base64 e retorna essa string
    return body.toString('base64');
}

// Decodifica uma string base64 e salva o resultado em um arquivo
export async function base64Decode (base64Str, outputFilePath) {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(base64Str, 'base64');
        fs.writeFile(outputFilePath, buffer, (err) => {
            if (err) reject(err);
            else resolve(outputFilePath);
        });
    });
};