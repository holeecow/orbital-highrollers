import { Link } from "react-router-dom";
import React, { useState } from "react";
import { auth } from "../../firebase.js"; // Adjust the import based on your firebase setup
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth"; // Import the sign-in function
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter(); // Hook to programmatically navigate after sign-in

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCard, setResetCard] = useState(false); // State to manage reset password modal visibility
  const [resetEmail, setResetEmail] = useState(""); // State for email input in reset card
  const signIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // navigate to home page when the user really is signed in
    } catch (err) {
      console.error(err.code, err.message);
    }
  };
  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetCard(false);
    } catch (err) {
      alert(err.message); // surface auth/invalid-email, auth/user-not-found, etc.
    }
  };

  // Forget password card
  const forgetPasswordCard = (
    <div className="card bg-neutral text-neutral-content w-96">
      <div className="card-body items-center text-center">
        <h2 className="card-title">Enter your email address!</h2>
        <input
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          type="email"
          placeholder="example@example.com"
          className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:placeholder-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
        ></input>
        <div className="card-actions justify-center gap-4">
          <button className="btn btn-primary" onClick={handlePasswordReset}>
            Reset password
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setResetCard(false)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );

  const overlay = resetCard && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {forgetPasswordCard}
    </div>
  );

  return (
    <>
      {overlay}
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center">
        <div className="flex justify-center">
          <div className="flex items-center mx-auto ">
            <div className="flex-1">
              <div className="text-center">
                <div className="flex justify-center mx-auto ">
                  <img
                    className="w-auto h-7 sm:h-8"
                    src="https://merakiui.com/images/logo.svg"
                    alt=""
                  ></img>
                </div>

                <p className="mt-3 text-gray-500 dark:text-gray-300">
                  Sign in to access your account
                </p>
              </div>

              <div className="mt-8">
                <form onSubmit={signIn}>
                  <div>
                    <label
                      for="email"
                      className="block mb-2 text-sm text-gray-600 dark:text-gray-200"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="example@example.com"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:placeholder-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between mb-2">
                      <label
                        for="password"
                        className="text-sm text-gray-600 dark:text-gray-200"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setResetCard(true)}
                        className="text-sm text-gray-400 focus:text-blue-500 hover:text-blue-500 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <input
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Your Password"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:placeholder-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="mt-6">
                    {/* <Link to="/authdetails"> */}
                    <button
                      type="submit"
                      className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:bg-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50 cursor-pointer"
                    >
                      Log in
                    </button>
                    {/* </Link> */}
                  </div>
                </form>
                <p className="mt-6 text-sm text-center text-gray-400">
                  Don&#x27;t have an account yet?{" "}
                  <Link
                    href="/signup"
                    className="text-blue-500 focus:outline-none focus:underline hover:underline"
                  >
                    Sign up.
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
