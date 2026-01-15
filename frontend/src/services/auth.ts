import { jwtDecode } from "jwt-decode";

export const getToken = () => {
  const user = localStorage.getItem("user");
  if (!user) return null;

  const data = JSON.parse(user);
  return data.access;
};

export const getUser = () => {
  const token = getToken();
  if (!token) return null;

  return jwtDecode(token) as any;
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};

export const getUserRole = () => {
  const user = localStorage.getItem("user");
  if (!user) return 0;

  try {
    const data = JSON.parse(user);
    // Prefer the new is_staff field, fallback to legacy is_admin
    const raw = data.is_staff ?? data.is_admin;
    if (typeof raw === "boolean") return raw ? 1 : 0;
    const num = Number(raw);
    if (Number.isNaN(num)) return 0;
    return num; // expected: 1 (admin), 3 (staff), 4 (superadmin), otherwise 0 = usuario
  } catch {
    return 0;
  }
};

export const isSuperAdmin = () => getUserRole() === 4;

export const isAdmin = () => {
  const role = getUserRole();
  // 1 = admin, 4 = superadmin
  return role === 1 || role === 4;
};

export const getUserId = (): number | null => {
  const user = getUser();
  if (!user) return null;
  return (user.user_id as number) || (user.id as number) || null;
};
