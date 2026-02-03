import CookieNavbar from "./components/CookieNavbar";

export default function CookieCapesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CookieNavbar />
      {children}
    </>
  );
}
