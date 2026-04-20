import { apiClient } from './client';

/**
 * API для профілю користувача.
 *
 *  GET /users/me         → поточний профіль
 *  PUT /users/me         → оновити профіль (ім'я, налаштування)
 *                          body: UserProfile
 */

export async function fetchProfile() {
  return apiClient.get('/users/me', () => ({
    name: 'Мандрівник',
    joinedAt: new Date().toISOString(),
    notificationsEnabled: true,
  }));
}

export async function putProfile(profile) {
  return apiClient.put('/users/me', profile.toJSON?.() || profile, (body) => ({
    ...body,
    syncStatus: 'synced',
  }));
}
