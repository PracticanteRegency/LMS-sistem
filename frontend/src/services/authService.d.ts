interface LoginData {
  usuario: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh?: string;
  [key: string]: any;
  is_admin?: string | number | boolean;
  is_staff?: string | number | boolean; // nuevo campo soporta superadmin (4)
}

interface AuthService {
  login(data: LoginData): Promise<AuthResponse>;
  logout(): void;
}

declare const authService: AuthService;
export default authService;
