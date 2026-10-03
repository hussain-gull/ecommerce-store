export type JwtPayload = {
  sub: string; // user id
  email?: string;
  // Present and set to "admin" only on admin-issued tokens.
  role?: "admin";
  iat?: number;
  exp?: number;
};
