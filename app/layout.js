import Link from "next/link";
import "./globals.css";
import { getSupplier } from "@/lib/session";
import { logout } from "@/app/actions";

export const metadata = {
  title: "My Marketplace",
  description: "Discover independent shops",
};

export default async function RootLayout({ children }) {
  const supplier = await getSupplier();
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/"><strong>My Marketplace</strong></Link>
          <Link href="/shops">Shops</Link>
          <span className="spacer" />
          {supplier ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <form action={logout}><button>Log out</button></form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Supplier sign up</Link>
            </>
          )}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
