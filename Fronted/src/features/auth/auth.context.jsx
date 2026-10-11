import { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Perform the initial auth check once when the app mounts.
    // Doing it here (not inside useAuth) means it runs exactly once
    // regardless of how many components call useAuth().
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch {
                // No valid cookie — user is not authenticated
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )

}