/// <reference types="vite/client" />
import { createClient } from '@insforge/sdk';

let baseUrl = import.meta.env.VITE_INSFORGE_URL || 'https://7xg3ff6f.ap-southeast.insforge.app';
if (baseUrl && baseUrl.endsWith('/')) {
  baseUrl = baseUrl.slice(0, -1);
}
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || 'ik_5702879588ae53c3779be820d6a9ea6b';

console.log('[InsForge client] Init with baseUrl:', baseUrl, 'key-prefix:', anonKey ? anonKey.substring(0, 8) + '...' : 'none');

export const insforge = createClient({
  baseUrl,
  anonKey,
});


