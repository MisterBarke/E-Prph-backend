const int = (val: string | undefined, num: number): number =>
  val ? (isNaN(parseInt(val)) ? num : parseInt(val)) : num;
const bool = (val: string | undefined, bool: boolean): boolean =>
  val == null ? bool : val == 'true';

export default () => ({
  port: int(process.env.PORT, 5000),
  database: process.env.MONGODB_STRING,
  db: {
    host: process.env.HOST,
    port: int(process.env.PORT, 27017),
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  },
  ratelimit: {
    ttl: int(process.env.RATELIMIT_TTL, 10000),
    limit: int(process.env.RATELIMIT_LIMIT, 50),
  },
  supabase: {
    url: process.env.SUPERBASE_PROJECT_URL,
    key: process.env.SUPERBASE_API_KEY,
    jwt_secret: process.env.SUPERBASE_JWT_TOKEN,
    admin: {
      email: process.env.SUPERBASE_ADMIN_EMAIL,
      password: process.env.SUPERBASE_ADMIN_PASSWORD,
    },
  },
  mail: {
    host: process.env.MAIL_HOST_NAME,
    port: int(process.env.MAIL_PORT, 465),
    isSecure: bool(process.env.MAIL_HOST_SECURE, true),
    user: process.env.MAIL_AUTH_USER,
    password: process.env.MAIL_AUTH_PASSWORD,
    from: process.env.MAIL_DEFAULT_FROM,
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expire: process.env.JWT_EXPIRATION_TIME,
  },
});
