import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'passkeys.json');

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

export const getPasskeys = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

export const savePasskey = (newPasskey) => {
    const passkeys = getPasskeys();
    passkeys.push(newPasskey);
    fs.writeFileSync(DB_PATH, JSON.stringify(passkeys, null, 2));
};

export const getPasskeyByCredentialID = (credentialID) => {
    const passkeys = getPasskeys();
    return passkeys.find(p => p.id === credentialID);
};

export const getUserPasskeys = (userId) => {
    const passkeys = getPasskeys();
    return passkeys.filter(p => p.userID === userId);
};

export const updatePasskeyCounter = (credentialID, newCounter) => {
    const passkeys = getPasskeys();
    const passkey = passkeys.find(p => p.id === credentialID);
    if (passkey) {
        passkey.counter = newCounter;
        fs.writeFileSync(DB_PATH, JSON.stringify(passkeys, null, 2));
    }
};

// In-memory store for challenges (ephemeral)
const challenges = new Map();

export const setChallenge = (userId, challenge) => {
    challenges.set(userId, challenge);
};

export const getChallenge = (userId) => {
    return challenges.get(userId);
};

export const clearChallenge = (userId) => {
    challenges.delete(userId);
};
