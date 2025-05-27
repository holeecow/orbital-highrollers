import "../globals.css";
import Header from "../components/Header";
import { AuthProvider } from "@/contexts/AuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Header /> {/* shows on every route */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}
