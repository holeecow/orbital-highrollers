import "../globals.css";
import Header from "../components/Header";
import { AuthProvider } from "@/contexts/AuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="flex flex-col h-screen">
        <Header /> {/* shows on every route */}
        <main className="flex-1 overflow-hidden">
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}
