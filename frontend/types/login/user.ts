export type User = {
  id: number;
  email: string;
  name: string;
  user_role: {
    name: string;
  };
  high_school: {
    name: string;
  };
};
