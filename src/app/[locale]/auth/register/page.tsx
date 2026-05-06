import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });
  return { title: t("title") };
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-indigo-600/10 dark:bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative w-full">
        <RegisterForm locale={locale} />
      </div>
    </div>
  );
}
