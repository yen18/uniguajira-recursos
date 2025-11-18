import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
// Plugin community para almacenamiento seguro (Android/iOS). En web se cae a localStorage.
// La importación puede fallar en web si no está disponible; se maneja condicionalmente.
let SecureStoragePlugin;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  ({ SecureStoragePlugin } = require('capacitor-secure-storage-plugin'));
} catch (_) {
  SecureStoragePlugin = null;
}

const TOKEN_KEY = 'access_token';
let memoryToken = null;

const isNative = () => Capacitor.isNativePlatform && Capacitor.isNativePlatform();

export async function setAccessToken(token) {
  memoryToken = token;
  if (isNative() && SecureStoragePlugin) {
    try {
      await SecureStoragePlugin.set({ key: TOKEN_KEY, value: token });
      return;
    } catch (e) {
      // fallback a Preferences
    }
  }
  try {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  } catch (_) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function loadAccessToken() {
  if (memoryToken) return memoryToken;
  if (isNative() && SecureStoragePlugin) {
    try {
      const { value } = await SecureStoragePlugin.get({ key: TOKEN_KEY });
      memoryToken = value || null;
      return memoryToken;
    } catch (_) {}
  }
  try {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    memoryToken = value || localStorage.getItem(TOKEN_KEY) || null;
  } catch (_) {
    memoryToken = localStorage.getItem(TOKEN_KEY) || null;
  }
  return memoryToken;
}

export function getAccessTokenSync() {
  return memoryToken;
}

export async function removeAccessToken() {
  memoryToken = null;
  if (isNative() && SecureStoragePlugin) {
    try { await SecureStoragePlugin.remove({ key: TOKEN_KEY }); } catch (_) {}
  }
  try { await Preferences.remove({ key: TOKEN_KEY }); } catch (_) {}
  localStorage.removeItem(TOKEN_KEY);
}

export async function clearAllSecure() {
  if (isNative() && SecureStoragePlugin) {
    try { await SecureStoragePlugin.clear(); } catch (_) {}
  }
  await Preferences.remove({ key: TOKEN_KEY });
  localStorage.removeItem(TOKEN_KEY);
}
