import { Outlet } from "@tanstack/react-router";
import { Header } from "../components/Header";

export function RootLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
