import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { User } from "@/types/signUp/user";
import { UserRole } from "@/types/signUp/user_role";

type SignUpProps = {
  setErrorMessage: (message: string) => void;
  userRole: UserRole;
};

type ErrorResponse = {
  errors?: string[] | string;
};

export const useSubmit = ({ setErrorMessage, userRole }: SignUpProps) => {
  const router = useRouter();

  const onSubmit: SubmitHandler<User> = async (data: User) => {
    setErrorMessage("");

    const postData: User = {
      user: {
        ...data.user,
        user_role_name: userRole,
      },
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const body = (await response
          .json()
          .catch(() => null)) as ErrorResponse | null;

        const messageFromApi =
          typeof body?.errors === "string"
            ? body.errors
            : Array.isArray(body?.errors)
              ? body.errors[0]
              : null;

        throw new Error(messageFromApi ?? "新規登録に失敗しました");
      }

      const redirect =
        userRole === "admin"
          ? "/admin/dashboard"
          : userRole === "teacher"
            ? "/teacher/dashboard"
            : "/";
      router.push(redirect);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "不明なエラーが発生しました";

      setErrorMessage(message);
    }
  };
  return { onSubmit };
};
