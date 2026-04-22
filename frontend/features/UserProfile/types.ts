export type GenderType = "male" | "female" | "other";

export type Address = {
  postal_code: string;
  city: string;
  town: string;
  prefecture: {
    id: number;
    name: string;
  };
};
