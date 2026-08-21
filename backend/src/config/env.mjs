export function validateEnv() {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-secret-change-me';
  }
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = 'mongodb://localhost:27018/ecobank';
  }
  return process.env;
}

export default validateEnv;
