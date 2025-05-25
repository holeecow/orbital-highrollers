import Hero from '../components/Hero';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Add links to other pages */}
      <nav style={{ marginTop: "20px" }}>
        <ul>
          <li><Link href="/login">Login</Link></li>
          <li><Link href="/signup">Signup</Link></li>
          <li><Link href="/authdetails">Auth Details</Link></li>
        </ul>
      </nav>
    </>
  );
}