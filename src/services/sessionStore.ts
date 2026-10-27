import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

const KEY = '@zelo:session';
let current: User | null = null;

export const sessionStore = {
    get: () => current,

    requireId(): string {
        if (!current) throw new Error('Sessão não iniciada');
        return current.id;
    },

    async restore() {
        const raw = await AsyncStorage.getItem(KEY);
        current = raw ? (JSON.parse(raw) as User) : null;
        return current;
    },

    async set(user: User) {
        current = user;
        await AsyncStorage.setItem(KEY, JSON.stringify(user));
    },

    async save(user: User) {
        await this.set(user);
    },

    async updateFoto(fotoUri: string) {
        if (!current) {
            await this.restore();
        }
        if (current) {
            current = {
                ...current,
                fotoUri,
            } as User;
            await AsyncStorage.setItem(KEY, JSON.stringify(current));
        }
    },

    async clear() {
        current = null;
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('@zelo:')));
    },
};