import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Разбери кучу — больше места для жизни",
  description: "Начните разбор вещей с одной фотографии. Демонстрация помощника по расхламлению.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
