import { Outlet, Link, useLocation } from "react-router-dom";
import { faHome, faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Layout = () => {
  const location = useLocation();

  // check if the current route is the root ("/") and render the login link accordingly
  const isLoginPage = location.pathname === "/";
  const isSignupPage = location.pathname === "/signup";

  const renderNavBar = !isLoginPage && !isSignupPage;

  return (
    <>
      {renderNavBar && (
        <nav>
          <ul className="iconContainer">
            <li className="home-icon">
              <Link to="/home">
                <FontAwesomeIcon icon={faHome} style={{ fontSize: "35px" }} />
              </Link>
            </li>
            <li className="title-icon">
              <Link to="/d3Graph">NoiseViz</Link>
            </li>
            <li className="settings-icon">
              <Link to="/settings">
                <FontAwesomeIcon icon={faCog} style={{ fontSize: "35px" }} />
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <Outlet />
    </>
  );
};

export default Layout;
