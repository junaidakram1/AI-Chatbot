import React from "react";
import { SignIn } from "@clerk/clerk-react";
import "./Login.css";
const Login = () => {
  return (
    <div className="login">
      {" "}
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
};

export default Login;
