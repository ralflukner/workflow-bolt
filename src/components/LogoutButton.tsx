import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LogoutButton: React.FC = () => {
  const { logout } = useAuth0();

  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
    >
      Log Out
    </button>
  );
};

export default LogoutButton; 