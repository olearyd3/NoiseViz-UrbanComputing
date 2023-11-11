const Settings = () => {
  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div>
      <h1>Settings</h1>
      <button onClick={logOut}>Log Out</button>
    </div>
  );
};

export default Settings;
