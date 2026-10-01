import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Asistencia | UTCH",
    template: "%s | Asistencia",
  },
  description:
    "Plataforma de gestión de asistencia académica para institución, docentes, representantes y estudiantes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
