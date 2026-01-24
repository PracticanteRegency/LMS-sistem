import { createContext } from 'react';

// Puedes extender este tipo según la estructura real de tu usuario
type UserType = {
  tipo_usuario?: number;
  [key: string]: any;
};

export const AuthContext = createContext<{ user: UserType | null }>({ user: null });
