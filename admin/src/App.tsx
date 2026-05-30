import { SubmitHandler, useForm } from "react-hook-form";
import "./App.css";
import Button from "./components/Button";
import { RiLoginBoxLine } from "react-icons/ri";
import { useLoginMutation } from "./redux/services/authentication";
import { handleError, handleResponse } from "./utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { deleteToken, getToken, setToken } from "./utils/tokenHandler";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "./components/Toast";
import { useDispatch } from "react-redux";
import { setAuthData } from "./redux/feature/authSlice";
import Logo from "./assets/fav.webp";
import { jwtDecode } from "jwt-decode";
import { clearProfile } from "./redux/feature/profileSlice";
import { trimFormData } from "./utils/validationHelper";
import { PROJECT_NAME } from "./constants/projectConstants";
import { useGetSettingQuery } from "./redux/services/settings";
import { IMAGE_BASE_URL } from "./constants";
import {
  Eye,
  EyeOff,
  Lock,
  type LucideIcon,
  UtensilsCrossed,
  UserRound,
} from "lucide-react";

interface FormValues {
  username: string;
  password: string;
  captchaToken?: string;
}

interface DecodedToken {
  exp: number;
  iat?: number;
  [key: string]: unknown;
}

interface AuthSlide {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  bullets: readonly string[];
}

const SLIDE_INTERVAL_MS = 5500;
const SLIDE_COUNT = 3;

function buildSlides(brandName: string): AuthSlide[] {
  return [
    {
      id: "welcome",
      icon: UserRound,
      title: `Welcome to ${brandName}`,
      subtitle: "Your floor, one dashboard",
      description:
        "Manage orders, tables, menu, and daily service from a single modern workspace.",
      bullets: [
        "Live order & table view",
        "Kitchen display sync",
        "Takeaway & dine-in billing",
      ],
    },
    {
      id: "security",
      icon: Lock,
      title: "Secure Staff Access",
      subtitle: "Roles you can trust",
      description:
        "Built for busy service with permissions that keep sensitive operations in the right hands.",
      bullets: [
        "Role-based permissions",
        "Staff activity visibility",
        "Secure authentication",
      ],
    },
    {
      id: "operations",
      icon: UtensilsCrossed,
      title: "Built for Service Speed",
      subtitle: "Less friction, faster turns",
      description:
        "Inventory, reports, and revenue tools designed for cafes and restro teams.",
      bullets: [
        "Menu & inventory control",
        "Daily sales reports",
        "Multi-payment checkout",
      ],
    },
  ];
}

export default function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const { data: settings } = useGetSettingQuery("");
  const [showPassword, setShowPassword] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideAnimKey, setSlideAnimKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const brandName = settings?.data?.brand_name || PROJECT_NAME;
  const slides = buildSlides(brandName);
  const logoSrc = settings?.data?.brandingImage
    ? settings.data.brandingImage.startsWith("http")
      ? settings.data.brandingImage
      : `${IMAGE_BASE_URL}${settings.data.brandingImage}`
    : Logo;

  const goToSlide = useCallback((index: number) => {
    setSlideIndex(index % SLIDE_COUNT);
    setSlideAnimKey((k) => k + 1);
  }, []);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % SLIDE_COUNT;
        setSlideAnimKey((k) => k + 1);
        return next;
      });
    }, SLIDE_INTERVAL_MS);
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoplay]);

  const handleDotClick = (index: number) => {
    goToSlide(index);
    startAutoplay();
  };

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
      } catch {
        Toast("Invalid Token. Please Try Again", "error");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    const href = settings?.data?.fav_icon
      ? `${IMAGE_BASE_URL}${settings.data.fav_icon}`
      : "/fav.webp";
    let link = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.type = "image/png";
      link.href = href;
    }
  }, [settings]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const trimmedData = trimFormData(data);
      const response = await login(trimmedData).unwrap();
      setToken("token", response.data.token);
      dispatch(setAuthData(response.data));
      handleResponse({
        res: response,
        onSuccess: () => navigate("/admin/order/list"),
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const activeSlide = slides[slideIndex];
  const SlideIcon = activeSlide.icon;

  return (
    <main className="auth-page">
      <section
        className="auth-brand-panel"
        aria-label="Cafe admin portal"
        onMouseEnter={() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }}
        onMouseLeave={startAutoplay}
      >
        <div className="auth-brand-panel__mesh" aria-hidden />

        <div
          className="auth-slider"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            key={`${activeSlide.id}-${slideAnimKey}`}
            className="auth-slide auth-slide--enter"
          >
            <div className="auth-diamond">
              {/* Tier 1 — narrow top */}
              <div className="auth-diamond__tier auth-diamond__tier--1">
                <div className="auth-hero-icon">
                  <SlideIcon size={28} strokeWidth={1.75} aria-hidden />
                </div>
                <p className="auth-hero-eyebrow">Cafe Admin Portal</p>
              </div>

              {/* Tier 2 — widest (diamond peak) */}
              <h2 className="auth-slide-title auth-diamond__tier auth-diamond__tier--2">
                {activeSlide.title}
              </h2>

              {/* Tier 3 — medium */}
              <p className="auth-slide-subtitle auth-diamond__tier auth-diamond__tier--3">
                {activeSlide.subtitle}
              </p>

              {/* Tier 4 — narrowing */}
              <p className="auth-slide-desc auth-diamond__tier auth-diamond__tier--4">
                {activeSlide.description}
              </p>

              {/* Tier 5 — narrow bottom */}
              <ul className="auth-slide-list auth-diamond__tier auth-diamond__tier--5">
                {activeSlide.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          className="auth-brand-dots"
          role="tablist"
          aria-label="Feature highlights"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Slide ${index + 1}: ${slide.title}`}
              className={`auth-dot${slideIndex === index ? " auth-dot--on" : ""}`}
              onClick={() => handleDotClick(index)}
            >
              {slideIndex === index && (
                <span
                  className="auth-dot__progress"
                  style={{ animationDuration: `${SLIDE_INTERVAL_MS}ms` }}
                  aria-hidden
                />
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <form className="auth-card__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-card__logo auth-anim-card" style={{ animationDelay: "0.1s" }}>
              <img src={logoSrc} alt={`${brandName} logo`} />
            </div>

            <h2 className="auth-card__title auth-anim-card" style={{ animationDelay: "0.16s" }}>
              {brandName} Login
            </h2>

            <div className="auth-field auth-anim-card" style={{ animationDelay: "0.22s" }}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your Username"
                className={errors.username ? "auth-field__input auth-field__input--error" : "auth-field__input"}
                {...register("username", { required: "Username is Required" })}
              />
              {errors.username && (
                <span className="auth-field__error">{errors.username.message}</span>
              )}
            </div>

            <div className="auth-field auth-anim-card" style={{ animationDelay: "0.28s" }}>
              <label htmlFor="password">Password</label>
              <div className="auth-field__password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  className={errors.password ? "auth-field__input auth-field__input--error" : "auth-field__input"}
                  {...register("password", { required: "Password is Required" })}
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={2} />
                  ) : (
                    <Eye size={18} strokeWidth={2} />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="auth-field__error">{errors.password.message}</span>
              )}
            </div>

            <Button
              type="submit"
              className="auth-submit auth-anim-card"
              style={{ animationDelay: "0.34s" }}
            >
              <span className="auth-submit__label">
                Login
                <RiLoginBoxLine size={20} aria-hidden />
              </span>
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
