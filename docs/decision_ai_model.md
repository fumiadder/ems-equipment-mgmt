# 技术决策记录 — AI 模型选型

## 决策编号
OI-02

## 背景
制造业设备管理系统的 AI 辅助决策模块需要实现故障预测、故障分类和维护推荐功能。设计文档中提出了候选方案，需根据制造业场景特点做出最终选型。

## 候选方案对比

| 维度 | 方案A：Isolation Forest + XGBoost | 方案B：LSTM Autoencoder + 随机森林 |
|------|-----------------------------------|--------------------------------------|
| **故障预测（异常检测）** | Isolation Forest | LSTM Autoencoder |
| **故障分类** | XGBoost | 随机森林 |
| **数据需求** | 无需大量故障样本，正常数据即可训练 | 需要较长的时序窗口数据 |
| **训练速度** | 快（分钟级） | 慢（小时级，需 GPU） |
| **推理延迟** | 低（<10ms） | 中（50-200ms） |
| **可解释性** | 中（XGBoost 支持 feature importance） | 低（LSTM 黑箱） |
| **部署复杂度** | 低（scikit-learn 轻量） | 高（PyTorch + GPU 依赖） |
| **制造业适配** | 适合故障数据稀缺场景（工厂常见） | 适合有丰富时序数据的场景 |

## 决策结果

**推荐方案A：Isolation Forest + XGBoost（主方案）+ LSTM Autoencoder（增强方案）**

### 理由

1. **制造业故障数据稀缺是常态**：Isolation Forest 只需正常运行数据即可训练异常检测模型，非常适合故障样本少的场景（[参考](https://www.cetainternational.com/insights/predictive-maintenance-manufacturing-guide)）
2. **XGBoost 在结构化数据分类上表现优异**：制造业传感器特征（温度、振动、电流等）是结构化数据，XGBoost 分类准确率高且可解释性强（[参考](https://www.f7i.ai/blog/beyond-the-hype-a-2025-blueprint-for-ai-predictive-maintenance-use-cases-in-machinery)）
3. **部署成本低**：scikit-learn + XGBoost 无需 GPU，CPU 推理即可满足 <10ms 延迟要求
4. **渐进增强策略**：先上线 Isolation Forest + XGBoost（MVP），积累足够数据后再引入 LSTM Autoencoder 提升预测精度

### 具体模型配置

| 模型 | 用途 | 输入特征 | 输出 | 部署方式 |
|------|------|----------|------|----------|
| Isolation Forest | 异常检测（故障预测） | 设备传感器时序特征（均值、方差、趋势斜率等统计特征） | 异常分数（0-1） | Python FastAPI，CPU 推理 |
| XGBoost | 故障分类 | 传感器特征 + 设备属性 + 维护历史 | 故障类型概率分布 | Python FastAPI，CPU 推理 |
| LSTM Autoencoder（二期） | 深度异常检测 | 原始时序数据窗口（如最近 1 小时） | 重建误差（异常分数） | Python FastAPI + ONNX Runtime |

### 评估指标

- 故障预测准确率 ≥ 80%（精确率 + 召回率的调和平均）
- 故障分类准确率 ≥ 85%
- 推理延迟 P99 ≤ 200ms
- 误报率 ≤ 15%（避免告警疲劳）

## 状态
✅ 已决策
