#!/bin/bash
# 启动脚本：初始化种子数据并启动服务
cd "$(dirname "$0")/.."
node src/seed/seed.js && node src/app.js
