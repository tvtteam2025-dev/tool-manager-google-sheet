import "./globals.css";

export const metadata = {
  title: "Work Tools Manager",
  description: "Quản lý công cụ làm việc nội bộ bằng Google Sheet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
