module.exports = {
  apps: [
    {
      name: "vhf-backend",
      script: "pnpm",
      args: "start:backend",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "vhf-frontend-server",
      script: "pnpm",
      args: "start:frontend-server",
      cwd: "./frontend/server",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
