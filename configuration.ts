export default () => ({
  "type": process.env.db_type,
  "host": process.env.db_host,
  "port": parseInt(process.env.db_port),
  "username": process.env.db_username,
  "password": encodeURIComponent(process.env.db_password),
  "database": process.env.db_name,
  "entities": ["dist/**/*.entity{.ts,.js}"],
  "dateStrings": true
});