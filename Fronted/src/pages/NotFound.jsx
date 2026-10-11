import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Go home</Link>
      </p>
    </div>
  );
};

export default NotFound;
