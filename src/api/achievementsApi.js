import { apiClient } from './client';
import { ACHIEVEMENTS } from '../data/achievements';

/**
 * API для досягнень.
 *
 *  GET  /achievements               → список усіх можливих досягнень
 *  GET  /users/me/achievements      → розблоковані досягнення користувача
 *  POST /users/me/achievements      → позначити ачівку як отриману
 *                                     body: { achievementId, unlockedAt }
 */

export async function fetchAllAchievements() {
  return apiClient.get('/achievements', () => {
    return ACHIEVEMENTS.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
    }));
  });
}

export async function fetchUnlockedAchievements() {
  return apiClient.get('/users/me/achievements', () => []);
}

export async function postUnlockedAchievement(achievement) {
  return apiClient.post('/users/me/achievements', {
    achievementId: achievement.id,
    unlockedAt: achievement.unlockedAt?.toISOString?.() || new Date().toISOString(),
  }, (body) => ({
    id: body.achievementId,
    unlockedAt: body.unlockedAt,
    syncStatus: 'synced',
  }));
}
