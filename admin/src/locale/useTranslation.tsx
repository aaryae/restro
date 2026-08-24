import { lang } from "./language";
import { getToken } from "@/utils/tokenHandler";

const getTranslation = (key: string): React.ReactNode => {
  const language = getToken("lang");
  const translations = lang[language];
  try {
    if (translations) {
      // change the key to lowercase
      const normalizedKey = key.toLowerCase();
      // change the keys of the lang to lowercase
      const normalizedTranslation = Object.fromEntries(
        Object.entries(translations).map(([k, v]) => [k.toLowerCase(), v]),
      );

      // check if the translation includes the key
      if (Object.keys(normalizedTranslation).includes(normalizedKey)) {
        const text =
          normalizedTranslation[
            normalizedKey as keyof typeof normalizedTranslation
          ];
        return <span lang="ja">{text}</span>;
      }
    }
  } catch {
    return <span lang="en">{key}</span>;
  }

  //   incase the translation is not in the key
  return <span lang="en">{key}</span>;
};

export default function useTranslation() {
  const translate = (value: string) => getTranslation(value);
  return translate;
}

export { useTranslation };
