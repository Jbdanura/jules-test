require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load .env file

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10), // Ensure port is an integer
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    }
  },
  test: {
    username: process.env.DB_USER_TEST || process.env.DB_USER,
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || 'reddit_clone_test',
    host: process.env.DB_HOST_TEST || process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT_TEST || process.env.DB_PORT, 10), // Ensure port is an integer
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    }
  },
  production: {
    use_env_variable: "DATABASE_URL", // For services like Heroku that provide DATABASE_URL
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necessary for some cloud providers
      }
    }
  }
};
