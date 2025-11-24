import "../css/login.css";
import { RegisterForm } from "../components/regsiter-form";
import AnimatedGridPatternDemo from "../components/gridbackground";

export default function Register() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block login-container">
        <AnimatedGridPatternDemo />
        <div className="image-text">
          <h1>Make.<br />What.<br />Matters.<br /></h1>
          <p>Automate. Accelerate. Escape.</p>
        </div>
        <div className="image-text-2">
          <h1>Ideate.<br />and.<br />Innovate.<br /></h1>
          <p>Do everything at one place</p>
        </div>
        <div className="branding-badge">
          <img src="./src/images/avara_logo.png" alt="Avara Logo" className="branding-logo" />
          <span className="branding-text">Avara</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs glass-card">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
