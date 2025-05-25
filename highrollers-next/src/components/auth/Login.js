import Link from 'next/link';
import React, { useState } from "react";
import { auth } from "../../firebase.js"; // Adjust the import based on your firebase setup
import { signInWithEmailAndPassword } from "firebase/auth"; // Import the sign-in function
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); // Hook to programmatically navigate after sign-in

  const signIn = async (e) => {
    //   e.preventDefault(); // Prevent reloading the page on form submission
    //   signInWithEmailAndPassword(auth, email, password)
    //     .then((userCredential) => {
    //       // Signed in
    //       const user = userCredential.user;
    //       console.log("User signed in:", user);
    //       // Redirect or perform any other action after successful sign-in
    //     })
    //     .catch((error) => {
    //       const errorCode = error.code;
    //       const errorMessage = error.message;
    //       console.error("Error signing in:", errorCode, errorMessage);
    //       // Handle errors here (e.g., show an alert or message)
    //     });
    // };
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/authdetails"); // ✅ navigate when the user really is signed in
    } catch (err) {
      // console.error(err.code, err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="flex justify-center h-screen">
        <div className="flex items-center w-full max-w-md px-6 mx-auto lg:w-2/6">
          <div className="flex-1">
            <div className="text-center">
              <div className="flex justify-center mx-auto">
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
                    <Link
                      href="/"
                      className="text-sm text-gray-400 focus:text-blue-500 hover:text-blue-500 hover:underline"
                    >
                      Forgot password?
                    </Link>
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
                    className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:bg-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
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
                  Sign up
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
