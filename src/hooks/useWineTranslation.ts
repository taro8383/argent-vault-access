import { useTranslation } from "react-i18next";

interface WineTranslation {
  description: string;
  rationale: string;
  category: string;
}

export const useWineTranslation = () => {
  const { t, i18n } = useTranslation("wines");

  const getWineTranslation = (
    wineId: string,
    field: keyof WineTranslation,
    defaultValue: string
  ): string => {
    const key = `wines.${wineId}.${field}`;
    const translated = t(key, { defaultValue: "" });
    return translated || defaultValue;
  };

  const hasWineTranslation = (wineId: string, field: keyof WineTranslation): boolean => {
    const key = `wines.${wineId}.${field}`;
    return i18n.exists(key);
  };

  return {
    getWineTranslation,
    hasWineTranslation,
  };
};

export default useWineTranslation;
