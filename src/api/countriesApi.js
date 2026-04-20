import { apiClient } from './client';
import { COUNTRIES } from '../data/countries';

/**
 * ============================================================
 * API для роботи з країнами (REST)
 * ============================================================
 *
 * Базовий URL: https://api.travelmap.example
 *
 * Ендпоінти:
 *
 *  GET    /countries              → масив усіх країн (довідник)
 *  GET    /countries/:id          → одна країна за id
 *  GET    /users/me/visited       → масив відвіданих країн поточного користувача
 *  POST   /users/me/visited       → позначити країну як відвідану
 *                                   body: { countryId, name, date, note }
 *  DELETE /users/me/visited/:id   → прибрати позначку "відвідано"
 *  PUT    /users/me/visited/:id   → оновити нотатку/дату
 *                                   body: { date, note }
 *
 * Усі мережеві виклики зараз мокові (з затримкою 500ms).
 */

// ----- Довідник країн -----

export async function fetchAllCountries() {
  return apiClient.get('/countries', () => {
    // Сервер би повернув такі ж дані, які у нас у COUNTRIES
    return COUNTRIES.map((c) => ({
      id: c.id,
      name: c.name,
      continent: c.continent,
    }));
  });
}

export async function fetchCountryById(id) {
  return apiClient.get(`/countries/${id}`, () => {
    const c = COUNTRIES.find((x) => x.id === id);
    if (!c) throw new Error(`Country ${id} not found`);
    return { id: c.id, name: c.name, continent: c.continent };
  });
}

// ----- Відвідані країни поточного користувача -----

export async function fetchVisitedCountries() {
  // У справжньому сервері тут була б авторизація.
  // Мок: повертаємо порожній список (сервер "нічого про нас не знає"
  // — джерело істини для нас локальна БД, бо ми offline-first).
  return apiClient.get('/users/me/visited', () => []);
}

export async function postVisitedCountry(country) {
  // Приймає екземпляр Country (або plain-об'єкт з тими ж полями).
  return apiClient.post('/users/me/visited', {
    countryId: country.id,
    name: country.name,
    date: country.dateVisited ? country.dateVisited.toISOString?.() : null,
    note: country.note,
  }, (body) => {
    // Мок-відповідь: сервер "зберіг" і повертає об'єкт з syncStatus
    return {
      id: body.countryId,
      name: body.name,
      date: body.date,
      note: body.note,
      syncStatus: 'synced',
    };
  });
}

export async function deleteVisitedCountry(id) {
  return apiClient.delete(`/users/me/visited/${id}`, () => ({ success: true }));
}

export async function putVisitedCountry(id, updates) {
  return apiClient.put(`/users/me/visited/${id}`, updates, (body) => ({
    id,
    ...body,
    syncStatus: 'synced',
  }));
}
