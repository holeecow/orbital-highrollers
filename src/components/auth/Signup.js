import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/router";
import { auth, googleProvider } from "../../firebase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // State to hold error messages
  const router = useRouter();

  const SignUp = async (e) => {
    e.preventDefault(); // Prevent reloading the page on form submission
    setError(null); // Reset error before new signup attempt

    try {
      // Proactively check if the email is already in use
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        setError("This account already exists!");
        return;
      }

      // If the email isn't in use, create the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
        // Signed up
        const user = userCredential.user;
        console.log("User signed up:", user);
        // Redirect or perform any other action after successful sign-up
      router.push("/");
    } catch (error) {
      // Fallback and extended error handling
      if (error.code === "auth/email-already-in-use") {
        setError("This account already exists!");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password must be at least 6 characters long.");
      } else {
        console.error("Error signing up:", error.code, error.message);
        setError("Failed to create an account. Please try again.");
      }
    }
  };

  const signUpWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo.isNewUser) {
        // If it's a new user, proceed to the homepage.
        router.push("/"); // Navigate to home page on successful sign-up
      } else {
        // If the user already exists, sign them out and show an error.
        await signOut(auth);
        setError("An account with this email already exists. Please log in.");
      }
    } catch (err) {
      // This catches other errors, like if the email exists with a different credential (e.g., password)
      if (err.code === "auth/account-exists-with-different-credential") {
        setError(
          "An account with this email already exists. Please log in using your original method."
        );
      } else {
        setError("Failed to sign up with Google. Please try again.");
        console.error("Google sign-up error:", err.code, err.message);
      }
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900 ">
      <div className="flex min-h-screen ">
        <div className="flex items-center w-full max-w-3xl p-8 mx-auto lg:px-12 lg:w-3/5">
          <div className="w-full ">
            <h1 className="text-2xl font-semibold tracking-wider text-gray-800 capitalize dark:text-white">
              Get your free account now.
            </h1>

            <p className="mt-4 text-gray-500 dark:text-gray-400">
              {/* &rsquo is a html identity since quotation marks are not accepted */}
              Let&rsquo;s get you all set up so you can begin setting up your
              profile and start tracking your moves.
            </p>

            {error && (
              <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error}
              </div>
            )}

            <form
              className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2"
              onSubmit={SignUp}
            >
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  placeholder="johnsnow@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-5 py-3 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-md dark:placeholder-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">
                  Password (at least 6 characters)
                </label>
                <input
                  type="password"
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-5 py-3 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-md dark:placeholder-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
                />
              </div>

              <button
                type="submit"
                className="
              flex w-full px-6 py-3 tracking-wide text-white transition-colors duration-300 transform  bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:bg-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50 cursor-pointer"
              >
                Sign Up
              </button>
            </form>

            <div className="mt-4">
              <button
                onClick={signUpWithGoogle}
                className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-300 transform bg-red-500 rounded-lg hover:bg-red-400 focus:outline-none focus:bg-red-400 focus:ring focus:ring-red-300 focus:ring-opacity-50 cursor-pointer"
              >
                Sign up with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
