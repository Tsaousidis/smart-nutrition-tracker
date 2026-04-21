"use client";

import {usePathname, useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

export default function NavbarClient({session}: any) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navbar");

  const handleSwitch = (newLocale: "en" | "el") => {
    const newPath = pathname.replace(/^\/(en|el)/, "") || "/";
    router.push(`/${newLocale}${newPath}`);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSwitch("en")}
          className={`rounded border px-2 py-1 text-sm ${
            locale === "en" ? "bg-gray-100" : ""
          }`}
        >
          🇬🇧
        </button>

        <button
          onClick={() => handleSwitch("el")}
          className={`rounded border px-2 py-1 text-sm ${
            locale === "el" ? "bg-gray-100" : ""
          }`}
        >
          🇬🇷
        </button>
      </div>

      {session?.user ? (
        <span className="hidden text-sm text-gray-500 md:inline">
          {session.user.email}
        </span>
      ) : null}
    </div>
  );
}