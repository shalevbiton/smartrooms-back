
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else {
    console.error("PasskeyService: Missing Supabase credentials. Passkeys will not work.");
}

// Map DB format to Internal format
const mapPasskeyFromDB = (p) => ({
    id: p.cred_id,
    publicKey: Buffer.from(p.public_key, 'base64'), // Convert back to Buffer for simplewebauthn
    counter: p.counter,
    transports: p.transports,
    userID: p.user_id
});

export const getPasskeyByCredentialID = async (credentialID) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('passkeys')
        .select('*')
        .eq('cred_id', credentialID)
        .single();

    if (error || !data) return null;
    return mapPasskeyFromDB(data);
};

export const getUserPasskeys = async (userId) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('passkeys')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching user passkeys:", error);
        return [];
    }
    return data.map(mapPasskeyFromDB);
};

export const savePasskey = async (newPasskey) => {
    if (!supabase) return;

    // newPasskey structure from server.js: { id, publicKey, counter, transports, userID }
    // DB structure: { cred_id, public_key, counter, transports, user_id }

    const dbPasskey = {
        cred_id: newPasskey.id,
        public_key: newPasskey.publicKey, // This might be a Buffer/Uint8Array, need to stringify? 
        // simplewebauthn usually returns base64url or buffer.
        // We should treat it as text/base64 for storage or keep as varies.
        // Actually simplewebauthn uses base64url strings for IDs but publicKey might be buffer.
        // 'verifyRegistrationResponse' returns credentialPublicKey as Uint8Array (Buffer).
        // We need to convert Buffer to base64 string for storage if column is text.
        counter: newPasskey.counter,
        transports: newPasskey.transports,
        user_id: newPasskey.userID
    };

    // Ensure publicKey is a string (base64)
    if (typeof dbPasskey.public_key !== 'string') {
        dbPasskey.public_key = Buffer.from(dbPasskey.public_key).toString('base64');
    }

    const { error } = await supabase.from('passkeys').insert(dbPasskey);
    if (error) console.error("Error saving passkey:", error);
};

export const updatePasskeyCounter = async (credentialID, newCounter) => {
    if (!supabase) return;
    await supabase
        .from('passkeys')
        .update({ counter: newCounter })
        .eq('cred_id', credentialID);
};

// Stateless Challenge Store (DB)

export const setChallenge = async (userId, challenge) => {
    if (!supabase) return;
    // upsert
    await supabase
        .from('auth_challenges')
        .upsert({ user_id: userId, challenge });
};

export const getChallenge = async (userId) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('auth_challenges')
        .select('challenge')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data.challenge;
};

export const clearChallenge = async (userId) => {
    if (!supabase) return;
    await supabase
        .from('auth_challenges')
        .delete()
        .eq('user_id', userId);
};
