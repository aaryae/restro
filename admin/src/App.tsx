import { Turnstile } from "@marsidev/react-turnstile";

import { SubmitHandler, useForm } from "react-hook-form";
import "./App.css";
import Input from "./components/Input";
import Button from "./components/Button";
import { RiLoginBoxLine } from "react-icons/ri";
import { useLoginMutation } from "./redux/services/authentication";
import { handleError, handleResponse } from "./utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { deleteToken, getToken, setToken } from "./utils/tokenHandler";
import { useEffect, useRef, useState } from "react";
import Toast from "./components/Toast";
import { useDispatch } from "react-redux";
import { setAuthData } from "./redux/feature/authSlice";
import Logo from "./assets/fav.webp";
import { jwtDecode } from "jwt-decode";
import { clearProfile } from "./redux/feature/profileSlice";
import { trimFormData } from "./utils/validationHelper";
import { PROJECT_NAME } from "./constants/projectConstants";
import { sk } from "./constants";

interface FormValues {
  username: string;
  password: string;
  captchaToken?: string;
}

interface DecodedToken {
  exp: number; // Expiration time in seconds since the epoch
  iat?: number; // Issued at time (optional)
  [key: string]: any; // Other custom claims
}

export default function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const [captchaToken, setCaptchaToken] = useState<string>();
  const [login] = useLoginMutation();

  // const turnstileRef = useRef<any>(null);

  useEffect(() => {
    const token = getToken("token");
    setToken("lang", "en");
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);

        if (decodedToken?.exp * 1000 > Date.now()) {
          navigate("/admin/dashboard");
          Toast("User Logged in Successful", "success");
        } else {
          Toast("Session Expired. Please Try Again", "error");
          dispatch(clearProfile());
          deleteToken("token");
          navigate("/");
        }
      } catch (error) {
        Toast("Invalid Token. Please Try Again", "error");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const trimmedData = trimFormData(data);
      // trimmedData.captchaToken = captchaToken as string;
      const response = await login(trimmedData).unwrap();
      setToken("token", response.data.token);
      dispatch(setAuthData(response.data));
      handleResponse({
        res: response,
        onSuccess: () => navigate("/admin/dashboard"),
      });
    } catch (error) {
      handleError({ error });
      // if (turnstileRef.current) {
      //   turnstileRef.current.reset();
      // }
      // setCaptchaToken("");
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-form-wrapper">
          <img src={Logo} alt="Logo" className="auth-logo" />
          <h1>{PROJECT_NAME} Login</h1>
          <Input
            label="Username"
            placeholder="Enter your Username"
            {...register("username", { required: "Username is Required" })}
            error={errors.username}
          />
          <Input
            label="Password"
            placeholder="Password"
            type="password"
            {...register("password", { required: "Password is Required" })}
            error={errors.password}
          />

          {/* <Turnstile
            ref={turnstileRef}
            className="text-red-500 "
            options={{ size: "flexible", theme: "light" }}
            onSuccess={(token: string) => {
              setCaptchaToken(token);
            }}
            siteKey={sk as string}
          /> */}

          <Button type="submit" className="submit-button">
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              Login <RiLoginBoxLine />
            </div>
          </Button>
        </div>
      </form>
    </main>
  );
}
