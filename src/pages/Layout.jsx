import { Outlet, Link, useLocation } from "react-router-dom";

const Layout = () => {
  const location = useLocation();

  // Check if the current route is the root ("/") and render the Login link accordingly
  const isLoginPage = location.pathname === "/";
  const isSignupPage = location.pathname === "/signup";

  const renderNavBar = !isLoginPage && !isSignupPage;

  return (
    <>
      {renderNavBar && (
        <nav>
          <ul>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>

            <li>
              <Link to="/home">Home</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
      )}
      <Outlet />
    </>
  );
};

export default Layout;
