import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/courier-prime/700.css";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

/**
 * Segura o render até as fontes carregarem e devolve `true` quando prontas
 * (o título e a lista usam isso para medir o texto e ajustar o tamanho).
 */
export const useFonts = (allText: string) => {
  const [handle] = useState(() => delayRender("Carregando fontes"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sample = allText || "A";
    Promise.all([
      document.fonts.load(`900 80px Montserrat`, sample),
      document.fonts.load(`800 48px Montserrat`, sample),
      document.fonts.load(`700 40px Montserrat`, sample),
      document.fonts.load(`700 44px "Courier Prime"`, sample),
    ])
      .then(() => document.fonts.ready)
      .catch((e) => console.warn("Falha ao carregar fontes", e))
      .finally(() => setReady(true));
  }, [allText]);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};
