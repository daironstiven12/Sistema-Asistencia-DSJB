import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Iniciar sesión | Asistencia",
  description:
    "Plataforma de gestión de asistencia para clases virtuales. Acceso para usuarios autorizados.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
