import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

// Wraps any route that requires authentication.
// While the initial auth check is still loading, render nothing (or a loader).
// Once resolved: authenticated → render children, unauthenticated → redirect to /login.
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return <main><h1>Loading.......</h1></main>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute
