#!/bin/bash

git pull && pnpm i && pnpm build && pm2 restart ecosystem.config.js
