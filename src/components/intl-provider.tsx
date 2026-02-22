"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { type Locale, useLocaleStore } from "@/lib/stores/locale-store";

type Messages = Record<string, unknown>;

async function fetchMessages(locale: Locale): Promise<Messages> {
  const res = await fetch(`/api/messages?locale=${locale}`);
  return res.json();
}

export function IntlProvider({
  initialMessages,
  children,
}: {
  initialMessages: Messages;
  children: React.ReactNode;
}) {
  const { locale } = useLocaleStore();
  const [messages, setMessages] = useState<Messages>(initialMessages);

  useEffect(() => {
    fetchMessages(locale).then(setMessages);
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
