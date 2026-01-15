import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Styles/login.css";

const LoginPage: React.FC = () => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const data = await authService.login({ usuario, password });

      const token = data?.access;

      const userData = {
        usuario,
        token,
        ...data,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/");
    } catch (err: any) {
      console.error("Error login:", err);
      setErrorMsg("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login_wrapper">
        <div className="animate form login_form">
          <section className="login_content">
            <div className="logo-placeholder">
              <div className="logo-box">
                <img 
                  src="img\REGENCYL.png" 
                  alt="Logo" 
                  className="logo-img"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <h1>Iniciar Sesión</h1>

              {errorMsg && (
                <div className="alert alert-danger">
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <input
                  type="text"
                  id="LoginUsuarios"
                  name="LoginUsuarios"
                  className="form-control"
                  placeholder="Usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  id="ClaveUsuarios"
                  name="ClaveUsuarios"
                  className="form-control"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <button 
                  className="btn btn-dark submit" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Iniciando..." : "Iniciar Sesión"}
                </button>
              </div>

              <div className="clearfix"></div>

              <div className="separator">
                <p>©2024 Grupo Empresarial - LMS</p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
