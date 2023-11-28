import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { NavLink, useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const logOut = async () => {
    await signOut(auth)
      .then(() => {
        console.log("Logged out successfully!");
        navigate("/");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  };

  return (
    <div>
      <h1 style={{ color: "#222222" }}>.</h1>
      <button className="gsi-material-button" onClick={logOut}>Log Out</button>
    </div>
  );
};

export default Settings;
