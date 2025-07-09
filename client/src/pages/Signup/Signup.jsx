import React from "react";
import "./Signup.css";
import { SignIn } from "@clerk/clerk-react";
const Signup = () => {
  return (
    <div className="signup">
      <SignIn path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
};

export default Signup;
