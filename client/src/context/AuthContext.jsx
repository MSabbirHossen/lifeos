import React, { createContext, useState, useEffect } from "react";
import API from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("auth:logout", handleLogout);

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [token]);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/auth/profile");
      setUser(data.data || data);
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await API.post("/auth/register", {
        username,
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
