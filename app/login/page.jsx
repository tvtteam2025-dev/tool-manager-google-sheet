import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="brandMark">WT</div>
        <h1>Đăng nhập admin</h1>
        <p>Truy cập hệ thống quản lý công cụ, tài khoản, mật khẩu, URL và ghi chú nội bộ.</p>
        <LoginForm />
      </section>
    </main>
  );
}
