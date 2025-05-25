import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function AuthDetails() {
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const listen = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthUser(user);
      } else {
        setAuthUser(null);
      }
    });
    return () => {
      listen(); // Unsubscribe from the listener when the component unmounts
    };
  }, []);

  const userSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out successfully");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };
  return (
    <div>
      {" "}
      {authUser ? (
        <>
          (<p>{`Signed in as ${authUser.email}`}</p>
          <button onClick={userSignOut}>Sign Out</button>)
        </>
      ) : (
        <p> Signed Out</p>
      )}
    </div>
  );
}
