import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    // Returns the user on success; throws on failure so the caller can show the error
    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return data.user
        } catch (err) {
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Returns the user on success; throws on failure so the caller can show the error
    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            return data.user
        } catch (err) {
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.error("Logout error:", err.message)
            // Still clear local user state even if the request fails
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    // NOTE: The initial getMe() check lives in AuthProvider, not here,
    // so it runs exactly once no matter how many components call useAuth().

    return { user, loading, handleRegister, handleLogin, handleLogout }
}