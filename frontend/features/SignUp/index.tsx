"use client";

import { User } from "@/types/signUp/user";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  FormControl,
  Select,
  MenuItem
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";
import { UserRole } from "@/types/signUp/user_role";
import { useSubmit } from "./hooks";
import debounce from "lodash/debounce";

type HighSchoolType = {
  id: number;
  name: string;
};

type GradeType = {
  id: number;
  year: number;
  display_name: string;
};

export const SignUp = ({
  userRole,
}: {
  userRole: UserRole;
}): React.JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [options, setOptions] = useState<HighSchoolType[]>([]);
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [showConfirmationPassword, setShowConfirmationPassword] =
    useState<boolean>(false);

  const fetchSchools = useMemo(() => {
    return debounce(async (keyword: string) => {
      if (keyword.length < 2 ) return;

      const res = await fetch(`/api/v1/high_schools?keyword=${keyword}`);

      const data = await res.json();
      console.log(data);

      setOptions(data);
  }, 300);
  }, []);

  const fetchGrades = useMemo(() => {
    return async (highSchoolId: number) => {
      const res = await fetch(`/api/v1/high_schools/${highSchoolId}/grades`);

      const data = await res.json();

      setGrades(data);
    };
  }, [])

  useEffect(() => {
    return () => {
      fetchSchools.cancel();
    };
  }, [fetchSchools]);

  useEffect(() => {
    return () => {
      setGrades([]);
    };
  }, [fetchSchools]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<User>();

  const { onSubmit } = useSubmit({ setErrorMessage, userRole });

  const roleTitleMap: Record<UserRole, string> = {
    student: "生徒",
    admin: "管理者",
    teacher: "教員",
    guardian: "保護者",
  };

  const renderTabs = (userRole: UserRole) => {
    return Object.entries(roleTitleMap)
      .filter(([role]) => role !== userRole)
      .map(([role, title]) => ({
        role: role as UserRole,
        title: title,
      }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", mt: 8, textAlign: "center" }}
        >
          新規登録({roleTitleMap[userRole]})
        </Typography>
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <Box sx={{ padding: 2, width: "100%" }}>
          <Box
            component="form"
            sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Box sx={{ mb: 2 }}>
              <Typography>氏名</Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("user.name")}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>氏名カナ</Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("user.name_kana")}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>メールアドレス</Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("user.email", {
                  required: "メールアドレスを入力してください",
                  pattern: {
                    value: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                    message: "メールアドレスの形式が正しくありません",
                  },
                })}
                error={!!errors.user?.email}
                helperText={errors.user?.email?.message}
              />
            </Box>
            {(userRole === "student" || userRole === "teacher") && (
              <>
                <Typography>在籍高校</Typography>
                <Autocomplete
                  options={options}
                  getOptionLabel={(option) => option.name}
                  onInputChange={(_, value) => {
                    fetchSchools(value);
                  }}
                  onChange={(_, value) => {
                    if (value) {
                      setValue("user.high_school_id", value.id);
                      fetchGrades(value.id)
                    } else {
                      setGrades([]);
                      setValue("user.high_school_id", undefined);
                      setValue("user.grade_id", "");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} />
                  )}
                />
                <Box sx={{ mb: 2 }}>
                  <Typography>学年</Typography>
                  <Controller
                    name="user.grade_id"
                    disabled={grades.length === 0}
                    rules={{ required: "学年を選択してください" }}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <Select {...field} onChange={(e) => field.onChange(Number(e.target.value))}>
                          {grades.map((grade) => (
                            <MenuItem key={grade.id} value={grade.id}>
                              {grade.display_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography>パスワード</Typography>
              <TextField
                type={showPassword ? "text" : "password"}
                fullWidth
                variant="outlined"
                {...register("user.password", {
                  required: "パスワードを入力してください",
                  minLength: {
                    value: 8,
                    message: "8文字以上で入力してください",
                  },
                })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                error={!!errors.user?.password}
                helperText={errors.user?.password?.message}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>パスワード(確認用)</Typography>
              <TextField
                type={showConfirmationPassword ? "text" : "password"}
                fullWidth
                variant="outlined"
                {...register("user.password_confirmation", {
                  required: "パスワードを入力してください",
                  minLength: {
                    value: 8,
                    message: "8文字以上で入力してください",
                  },
                })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() =>
                            setShowConfirmationPassword((prev) => !prev)
                          }
                          edge="end"
                        >
                          {showConfirmationPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                error={!!errors.user?.password_confirmation}
                helperText={errors.user?.password_confirmation?.message}
              />
            </Box>
            <Box sx={{ my: 4 }}>
              <Button
                type="submit"
                sx={{
                  width: "100%",
                  backgroundColor: "#0068b7",
                  color: "#ffffff",
                  p: 2,
                  fontSize: "large",
                }}
              >
                <Typography sx={{ fontSize: "large", textAlign: "center" }}>
                  登録
                </Typography>
              </Button>
            </Box>
            {renderTabs(userRole).map(({ role, title }) => (
              <Box
                key={role}
                sx={{ width: "100%", textAlign: "center", mb: 4 }}
              >
                <Link href={role === "student" ? "/signup" : `/${role}/signup`}>
                  {title}の方はこちら
                </Link>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
