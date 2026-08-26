import { getPasswordResetByToken, isPasswordResetValid } from "@/lib/portal/auth";
import ResetPasswordForm from "@/components/portal/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reset = await getPasswordResetByToken(token);

  if (!reset) {
    return (
      <ResetPasswordForm token={token} valid={false} errorMessage="Reset link not found." />
    );
  }

  if (!isPasswordResetValid(reset)) {
    return (
      <ResetPasswordForm
        token={token}
        valid={false}
        errorMessage="This reset link has already been used or expired."
      />
    );
  }

  return <ResetPasswordForm token={token} valid />;
}
