import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.forgot" });
  return { title: t("title") };
}

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <ForgotPasswordForm locale={locale} />
    </div>
  );
}
