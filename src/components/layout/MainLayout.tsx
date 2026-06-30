import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="pt-6 md:ml-80 md:pl-0">{children}</main>
    </>
  );
}
