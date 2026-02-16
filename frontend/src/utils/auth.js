// Token im localStorage speichern
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Token aus localStorage abrufen
export const getToken = () => {
  return localStorage.getItem('token');
};

// Token aus localStorage entfernen
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Prüfen ob Benutzer eingeloggt ist
export const isAuthenticated = () => {
  return !!getToken();
};

