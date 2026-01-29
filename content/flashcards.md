---
title: Flashcards Statistics
---

## 闪卡随机算法公式

本系统的闪卡抽取采用**多维度权重随机算法**（轮盘赌选择）。每张卡片被选中的概率与其最终权重成正比：

$$P(card_i) = \frac{W_{final, i}}{\sum_{j=1}^{n} W_{final, j}}$$

### 权重计算公式

每张卡片的最终权重 $W_{final}$ 由以下逻辑计算得出：

1.  **基础权重 ($W_{base}$)**：
    *   初始默认值：$1$
    *   新题加成：若从未查看过，则 $W_{base} = 3$
    *   反馈调整：
        *   点击“查看答案”：$W_{base} \leftarrow W_{base} + 2$
        *   点击“我认识”：$W_{base} \leftarrow \max(1, W_{base} - 1)$

2.  **时间补偿 ($W_{time}$)**：
    *   $W_{time} = \lfloor \frac{T_{now} - T_{last}}{1 \text{ day}} \rfloor$
    *   即距离上次查看每增加一天，权重增加 $1$。

3.  **冷却惩罚 ($F_{penalty}$)**：
    *   若 $T_{now} - T_{last} < 10 \text{ 分钟}$，则 $F_{penalty} = 0.1$
    *   否则 $F_{penalty} = 1$

### 最终权重合成

$$W_{final} = (W_{base} + W_{time}) \times F_{penalty}$$
