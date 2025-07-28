module.exports = {
  apps: [
    {
      name: "vhf-backend",
      script: "npm",
      args: "run start:backend",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "vhf-frontend",
      script: "npm",
      args: "run start:frontend-server",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
