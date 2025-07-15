import "../globals.css";
import Header from "../components/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>BJ Basics</title>
        <meta name="description" content="Learn and practice blackjack strategies." />
        <link rel="icon" href="/icon.png" />
      </Head>
      <div className="flex flex-col h-screen">
        <Header /> {/* shows on every route */}
        <main className="flex-1 overflow-auto">
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}
