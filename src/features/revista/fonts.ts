import { Cormorant_Garamond, Noto_Color_Emoji } from "next/font/google";

export const fontePergaminho = Cormorant_Garamond({
  subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-pergaminho", display: "swap",
});

// Fallback for emoji the device does not have (e.g. 🩺 🪞 🩻 🛟 on Windows 10
// 1809, which shows an empty box). Native emoji still win where they exist; the
// browser only downloads the slices of this font that a page actually needs.
export const fonteEmoji = Noto_Color_Emoji({
  subsets: ["emoji"], weight: "400", variable: "--font-emoji", display: "swap", preload: false,
});

export const fontesRevista = `${fontePergaminho.variable} ${fonteEmoji.variable}`;
