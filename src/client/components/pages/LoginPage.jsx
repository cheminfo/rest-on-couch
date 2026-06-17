import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Login from '../Login';

export function LoginPage(props) {
  const navigate = useNavigate();
  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
    if (props.loggedIn) {
      navigate('/');
    }
  }, [props.loggedIn, navigate]);

  if (props.loggedIn) return null;
  return <Login />;
}
