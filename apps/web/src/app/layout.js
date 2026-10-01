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

const themeScript = `
(function(){
  try{
    var s = localStorage.getItem('asistencia-tema');
    var d = s || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = d;
  }catch(e){}
})();
`.trim();

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
