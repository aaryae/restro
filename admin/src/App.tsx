import { SubmitHandler, useForm } from "react-hook-form";
import "./App.css";
import Button from "./components/Button";
import { RiLoginBoxLine } from "react-icons/ri";
import { useLoginMutation } from "./redux/services/authentication";
import { handleError, handleResponse } from "./utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { deleteToken, getToken, setToken } from "./utils/tokenHandler";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Toast from "./components/Toast";
import { useDispatch } from "react-redux";
import { setAuthData } from "./redux/feature/authSlice";
import Logo from "./assets/fav.webp";
import { jwtDecode } from "jwt-decode";
import { clearProfile } from "./redux/feature/profileSlice";
import { trimFormData } from "./utils/validationHelper";
import { PROJECT_NAME } from "./constants/projectConstants";
import { useGetSettingQuery } from "./redux/services/settings";
import { buildAssetUrl } from "./utils/buildAssetUrl";
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
  rememberMe?: boolean;
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
const REMEMBER_USERNAME_KEY = "auth_remember_username";
const REMEMBER_ME_KEY = "auth_remember_me";

function shadeHexColor(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (!/^[0-9A-F]{6}$/i.test(normalized)) return hex;

  const num = parseInt(normalized, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

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
  const [logoFailed, setLogoFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const brandName = settings?.data?.brand_name || PROJECT_NAME;
  const brandColor =
    settings?.data?.primaryColor && /^#[0-9A-F]{6}$/i.test(settings.data.primaryColor)
      ? settings.data.primaryColor
      : localStorage.getItem("brandColor") || "#032768";
  const slides = buildSlides(brandName);
  const logoSrc =
    !logoFailed && settings?.data?.brandingImage
      ? buildAssetUrl(settings.data.brandingImage)
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
          dispatch(
            setAuthData({
              token,
              id: Number(decodedToken.id) || null,
              roleId: Number(decodedToken.roleId) || 1,
              roleType: "Super Admin",
              username: String(decodedToken.email || ""),
              clientAccess: [],
              serverAccess: [],
              expiry: decodedToken.exp,
            }),
          );
          navigate("/admin/order/list");
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
    document.documentElement.style.setProperty("--primary-color", brandColor);
    localStorage.setItem("brandColor", brandColor);
  }, [brandColor]);

  useEffect(() => {
    setLogoFailed(false);
  }, [settings?.data?.brandingImage]);

  useEffect(() => {
    const href = settings?.data?.fav_icon
      ? buildAssetUrl(settings.data.fav_icon)
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

  const rememberedUsername = localStorage.getItem(REMEMBER_USERNAME_KEY) || "";
  const rememberedFlag = localStorage.getItem(REMEMBER_ME_KEY) === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: rememberedUsername,
      rememberMe: rememberedFlag,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const trimmedData = trimFormData(data);
      const { rememberMe, ...credentials } = trimmedData;

      if (rememberMe) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, credentials.username);
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY);
        localStorage.setItem(REMEMBER_ME_KEY, "false");
      }

      const response = await login(credentials).unwrap();
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
  const authThemeStyle = {
    "--auth-primary": brandColor,
    "--auth-primary-hover": shadeHexColor(brandColor, -24),
    "--auth-primary-soft": `${brandColor}22`,
    "--auth-primary-glow": `${brandColor}66`,
  } as CSSProperties;

  return (
    <main className="auth-page" style={authThemeStyle}>
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
              <img
                src={logoSrc}
                alt={`${brandName} logo`}
                onError={() => setLogoFailed(true)}
              />
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

            <label
              className="auth-remember auth-anim-card"
              style={{ animationDelay: "0.32s" }}
              htmlFor="rememberMe"
            >
              <input
                id="rememberMe"
                type="checkbox"
                className="auth-remember__checkbox"
                {...register("rememberMe")}
              />
              <span>Remember me</span>
            </label>

            <Button
              type="submit"
              className="auth-submit auth-anim-card"
              style={{ animationDelay: "0.38s" }}
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
