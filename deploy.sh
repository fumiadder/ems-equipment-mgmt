#!/bin/bash
# ═══════════════════════════════════════════════════════════
# EMS 智能设备管理系统 — 一键部署脚本
# ═══════════════════════════════════════════════════════════
# 使用方法：
#   1. 确保已安装 Node.js 18+ 和 npm
#   2. 将项目解压到本地目录
#   3. 在项目根目录运行：bash deploy.sh
# ═══════════════════════════════════════════════════════════

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   EMS 智能设备管理系统 — 一键部署到 Vercel + Render    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 检查环境 ──
echo "🔍 检查环境..."

if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，请先安装 Node.js 18+"
    echo "   下载地址：https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 未安装 npm"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低（当前 v$(node -v)），需要 18+"
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ npm $(npm -v)"
echo ""

# ── 安装依赖 ──
echo "📦 安装项目依赖..."
cd client && npm install --silent && cd ..
cd server && npm install --silent && cd ..
echo "✅ 依赖安装完成"
echo ""

# ── 构建前端 ──
echo "🏗️  构建前端..."
cd client && npm run build && cd ..
echo "✅ 前端构建完成（dist/ 目录）"
echo ""

# ── 检查 Vercel CLI ──
echo "🔍 检查 Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "📥 安装 Vercel CLI..."
    npm install -g vercel
fi
echo "✅ Vercel CLI 已就绪"
echo ""

# ── 部署前端到 Vercel ──
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  第 1 步：部署前端到 Vercel"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "⚠️  如果是首次使用 Vercel CLI，会打开浏览器要求登录/注册"
echo "    推荐使用 GitHub 账号登录"
echo ""

cd client

# 使用 vercel deploy --yes 跳过确认
echo "🚀 正在部署前端..."
VERCEL_OUTPUT=$(vercel deploy --yes --prod 2>&1)
echo "$VERCEL_OUTPUT"

# 提取部署 URL
FRONTEND_URL=$(echo "$VERCEL_OUTPUT" | grep -oP 'https://[a-zA-Z0-9-]+\.vercel\.app' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo ""
    echo "⚠️  未能自动提取前端 URL，请从上方输出中手动复制"
    echo "    部署后 Vercel 会显示类似：https://ems-equipment-mgmt.vercel.app"
    echo ""
    read -p "请粘贴 Vercel 分配的前端 URL: " FRONTEND_URL
fi

cd ..
echo ""
echo "✅ 前端已部署: $FRONTEND_URL"
echo ""

# ── 部署后端到 Render ──
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  第 2 步：部署后端到 Render"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "⚠️  Render 部署需要通过网页控制台操作"
echo "    请按以下步骤操作："
echo ""
echo "  1. 打开 https://dashboard.render.com"
echo "  2. 使用 GitHub 账号登录"
echo "  3. 点击 'New +' → 'Web Service'"
echo "  4. 连接你的 GitHub 仓库（需先将代码推送到 GitHub）"
echo "  5. 配置参数："
echo "     - Root Directory: server"
echo "     - Build Command: npm install"
echo "     - Start Command: npm start"
echo "     - Instance Type: Free"
echo "  6. 添加环境变量：PORT=3001, NODE_ENV=production"
echo "  7. 点击 'Create Web Service'"
echo ""
echo "  等待部署完成后，Render 会分配一个 URL，例如："
echo "  https://ems-equipment-backend.onrender.com"
echo ""

read -p "请粘贴 Render 分配的后端 URL (含 https://): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ 后端 URL 不能为空"
    exit 1
fi

# 去掉末尾斜杠
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  第 3 步：配置前端环境变量"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "正在为前端设置 API 地址..."

API_URL="${BACKEND_URL}/api/v1"
cd client

# 使用 vercel env 设置环境变量
echo "$API_URL" | vercel env add VITE_API_BASE_URL production 2>&1 || true

# 重新部署前端使环境变量生效
echo "🔄 重新部署前端以应用新的环境变量..."
VERCEL_REDEPLOY=$(vercel deploy --yes --prod 2>&1)
echo "$VERCEL_REDEPLOY"

FRONTEND_URL=$(echo "$VERCEL_REDEPLOY" | grep -oP 'https://[a-zA-Z0-9-]+\.vercel\.app' | head -1)

cd ..
echo ""
echo "✅ 环境变量已配置: VITE_API_BASE_URL=$API_URL"
echo ""

# ── 完成 ──
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    🎉 部署完成！                        ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  前端地址: $FRONTEND_URL"
echo "║  后端地址: ${BACKEND_URL}"
echo "║  API 地址: ${API_URL}"
echo "║                                                          ║"
echo "║  登录账号: admin / 123456                                ║"
echo "║                                                          ║"
echo "║  ⚠️  Render 免费套餐会在 15 分钟无访问后休眠              ║"
echo "║     首次请求需等待 30-60 秒唤醒                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
