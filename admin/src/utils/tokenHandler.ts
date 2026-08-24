function getToken(key: string) {
  const token = localStorage.getItem(key);
  return token;
}

function setToken(key: string, value: string) {
  localStorage.setItem(key, value);
}

function deleteToken(key: string) {
  localStorage.removeItem(key);
}

export { getToken, setToken, deleteToken };
