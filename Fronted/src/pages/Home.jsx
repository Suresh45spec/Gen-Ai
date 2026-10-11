import { useAuth } from '../features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await handleLogout()
    navigate('/login')
  }

  return (
    <div>
      <h1>Home</h1>
      {user && <p>Welcome, {user.username}!</p>}
      <button className='button primary-button' onClick={onLogout}>Logout</button>
    </div>
  );
};

export default Home;
