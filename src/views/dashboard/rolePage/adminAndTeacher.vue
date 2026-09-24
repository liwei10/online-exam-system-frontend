<template>
  <div class="app-container">
    <!-- 数据卡片区域 -->
    <div class="stats-container">
      <div class="stats-row">
        <!-- 班级总数卡片 -->
        <div class="stat-card">
          <div class="icon-container">
            <el-image
              style="width: 36px; height: 36px"
              :src="iconUrl.gradeImgUrl"
            />
          </div>
          <div class="stat-info">
            <div class="stat-title">班级总数</div>
            <div class="stat-value">{{ classCount }}</div>
          </div>
        </div>

        <!-- 试题总数卡片 -->
        <div class="stat-card">
          <div class="icon-container">
            <el-image
              style="width: 36px; height: 36px"
              :src="iconUrl.questionImgUrl"
            />
          </div>
          <div class="stat-info">
            <div class="stat-title">试题总数</div>
            <div class="stat-value">{{ quCount }}</div>
          </div>
        </div>

        <!-- 试卷总数卡片 -->
        <div class="stat-card">
          <div class="icon-container">
            <el-image
              style="width: 36px; height: 36px"
              :src="iconUrl.examImgUrl"
            />
          </div>
          <div class="stat-info">
            <div class="stat-title">试卷总数</div>
            <div class="stat-value">{{ examCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-panel">
      <div class="panel-head">
        <h3>快捷操作</h3>
        <p>常用管理入口，一键直达</p>
      </div>
      <div class="quick-grid">
        <button
          v-for="item in quickActions"
          :key="item.path"
          type="button"
          class="quick-item"
          @click="goQuick(item.path)"
        >
          <span class="quick-icon" :class="item.tone">
            <i :class="item.icon" />
          </span>
          <span class="quick-text">
            <strong>{{ item.title }}</strong>
            <em>{{ item.desc }}</em>
          </span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner" />
      <div class="loading-text">数据加载中...</div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- 图表区域 -->
    <div v-else class="charts-container">
      <div ref="classChart" class="chart-box" />
      <div ref="examChart" class="chart-box" />
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'
import { classCount, classExamCount, classAllCounts } from '@/api/stat'
import questionImgUrl from '@/assets/img/questions.png'
import examImgUrl from '@/assets/img/paper.png'
import gradePng from '@/assets/img/grade.png'
export default {
  name: 'AdminDashboard',
  data() {
    return {
      iconUrl: {
        // eslint-disable-next-line no-undef
        gradeImgUrl: gradePng,
        questionImgUrl: questionImgUrl,
        examImgUrl: examImgUrl
      },
      // 图表数据
      chartData: [],
      chartDataTitle: [],
      chartData2: [],
      chartDataTitle2: [],

      // 统计数据
      classCount: 0,
      quCount: 0,
      examCount: 0,

      // 状态控制
      loading: true,
      error: false,
      errorMessage: '',

      // 图表实例
      classChartInstance: null,
      examChartInstance: null,

      quickActions: [
        { title: '用户管理', desc: '新增与维护账号', path: '/user-management', icon: 'el-icon-user', tone: 'teal' },
        { title: '班级管理', desc: '班级与口令', path: '/class-management', icon: 'el-icon-office-building', tone: 'blue' },
        { title: '考试管理', desc: '查看与发布试卷', path: '/exam-management', icon: 'el-icon-document', tone: 'amber' },
        { title: '新增考试', desc: '快速创建试卷', path: '/exam-add', icon: 'el-icon-plus', tone: 'rose' },
        { title: '题库管理', desc: '题库分类维护', path: '/repo-management', icon: 'el-icon-folder-opened', tone: 'cyan' },
        { title: '试题管理', desc: '录入与编辑试题', path: '/questions-management', icon: 'el-icon-edit-outline', tone: 'indigo' },
        { title: '阅卷管理', desc: '批改主观题', path: '/answer-manage/marking-management', icon: 'el-icon-s-check', tone: 'green' },
        { title: '成绩分析', desc: '查看考试成绩', path: '/score-analysis/score-analysis', icon: 'el-icon-data-analysis', tone: 'slate' }
      ]
    }
  },

  watch: {
    loading(val) {
      if (!val && !this.error) {
        this.$nextTick(() => {
          if (!this.classChartInstance || !this.examChartInstance) {
            this.initCharts()
          } else {
            this.handleResize()
          }
        })
      }
    }
  },

  async created() {
    try {
      // 获取所有统计数据
      await this.fetchAllData()
    } catch (error) {
      this.handleError(error)
    }
  },

  mounted() {
    this.$nextTick(() => {
      // 初始化图表
      this.initCharts()

      // 添加窗口大小变化监听
      window.addEventListener('resize', this.handleResize)
    })
  },

  beforeDestroy() {
    // 销毁图表实例，避免内存泄漏
    if (this.classChartInstance) {
      this.classChartInstance.dispose()
    }
    if (this.examChartInstance) {
      this.examChartInstance.dispose()
    }

    // 移除窗口大小变化监听
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    goQuick(path) {
      this.$router.push(path)
    },
    // 获取所有数据
    async fetchAllData() {
      this.loading = true
      try {
        // 获取总数统计
        const res0 = await classAllCounts()
        if (res0.data) {
          this.classCount = res0.data.classCount
          this.quCount = res0.data.questionCount
          this.examCount = res0.data.examCount
        } else {
          this.classCount = 0
          this.quCount = 0
          this.examCount = 0
        }

        // 获取班级人数分布
        const res1 = await classCount()
        if (res1.data) {
          this.processChartData(res1.data)
        } else {
          this.chartData = [{ name: '暂无数据', value: 1 }]
          this.chartDataTitle = ['暂无数据']
          if (this.classChartInstance) {
            this.updateClassChart()
          }
        }

        // 获取班级试卷分布
        const res2 = await classExamCount()
        if (res2.data) {
          this.processChartData2(res2.data)
        } else {
          this.chartData2 = [{ name: '暂无数据', value: 1 }]
          this.chartDataTitle2 = ['暂无数据']
          if (this.examChartInstance) {
            this.updateExamChart()
          }
        }

        this.loading = false
      } catch (error) {
        this.handleError(error)
      }
    },

    // 处理错误
    handleError(error) {
      this.loading = false
      this.error = true
      this.errorMessage = `数据加载失败: ${error.message || '未知错误'}`
      console.error('数据加载失败:', error)
    },

    // 处理窗口大小变化
    handleResize() {
      if (this.classChartInstance) {
        this.classChartInstance.resize()
      }
      if (this.examChartInstance) {
        this.examChartInstance.resize()
      }
    },

    // 初始化图表
    initCharts() {
      this.$nextTick(() => {
        if (!this.$refs.classChart || !this.$refs.examChart) {
          return
        }
        if (!this.classChartInstance) {
          this.classChartInstance = echarts.init(this.$refs.classChart)
        }
        if (!this.examChartInstance) {
          this.examChartInstance = echarts.init(this.$refs.examChart)
        }
        this.updateClassChart()
        this.updateExamChart()
      })
    },

    // 处理班级人数分布数据
    processChartData(data) {
      if (data.length === 0) {
        this.chartData = [{ name: '暂无数据', value: 1 }]
        this.chartDataTitle = ['暂无数据']
      } else {
        this.chartData = data.map((item) => ({
          name: item.gradeName,
          value: item.totalStudent
        }))
        this.chartDataTitle = this.chartData.map((item) => item.name)
      }

      // 如果图表已初始化，则更新图表
      if (this.classChartInstance) {
        this.updateClassChart()
      }
    },

    // 处理班级试卷分布数据
    processChartData2(data) {
      // 新增逻辑：检查数据是否为空
      if (data.length === 0) {
        // 设置默认数据
        this.chartData2 = [{ name: '暂无数据', value: 1 }]
        this.chartDataTitle2 = ['暂无数据']
      } else {
        this.chartData2 = data.map((item) => ({
          name: item.gradeName,
          value: item.total
        }))
        this.chartDataTitle2 = this.chartData2.map((item) => item.name)
      }

      // 如果图表已初始化，则更新图表
      if (this.examChartInstance) {
        this.updateExamChart()
      }
    },

    getPieOption({ title, seriesName, data, legendData, colors }) {
      const isEmpty = !data || data.length === 0 || (data.length === 1 && data[0].name === '暂无数据')
      return {
        title: {
          text: title,
          left: 20,
          top: 12,
          textStyle: {
            color: '#0f172a',
            fontSize: 16,
            fontWeight: 600
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a}<br/>{b}：{c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 12,
          top: 56,
          bottom: 24,
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 10,
          pageIconSize: 12,
          pageTextStyle: {
            color: '#909399'
          },
          textStyle: {
            color: '#606266',
            fontSize: 12
          },
          formatter: (name) => {
            const item = (data || []).find((entry) => entry.name === name)
            if (!item || isEmpty) {
              return name
            }
            return name.length > 10 ? `${name.slice(0, 10)}...  ${item.value}` : `${name}  ${item.value}`
          },
          tooltip: {
            show: true
          },
          data: legendData
        },
        color: colors,
        series: {
          name: seriesName,
          type: 'pie',
          radius: ['38%', '62%'],
          center: ['36%', '55%'],
          minAngle: 3,
          avoidLabelOverlap: true,
          data,
          label: {
            normal: {
              show: !isEmpty,
              formatter: (params) => (params.percent >= 8 ? `${params.name}\n${params.percent}%` : ''),
              fontSize: 12,
              color: '#606266'
            }
          },
          labelLine: {
            normal: {
              show: true,
              length: 10,
              length2: 8
            }
          },
          itemStyle: {
            normal: {
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        }
      }
    },

    // 更新班级人数分布图表
    updateClassChart() {
      if (!this.classChartInstance) return
      this.classChartInstance.setOption(this.getPieOption({
        title: '班级人数分布',
        seriesName: '班级人数',
        data: this.chartData,
        legendData: this.chartDataTitle,
        colors: [
          '#14b8a6', '#0ea5e9', '#38bdf8', '#2dd4bf', '#f59e0b',
          '#fb7185', '#64748b', '#22c55e', '#06b6d4', '#a3e635',
          '#0d9488', '#0284c7', '#f97316', '#ef4444', '#84cc16',
          '#475569', '#14b8a6', '#36d399', '#60a5fa', '#fbbf24'
        ]
      }), true)
    },

    // 更新班级试卷分布图表
    updateExamChart() {
      if (!this.examChartInstance) return
      this.examChartInstance.setOption(this.getPieOption({
        title: '班级试卷分布',
        seriesName: '试卷数量',
        data: this.chartData2,
        legendData: this.chartDataTitle2,
        colors: [
          '#f43f5e', '#0d9488', '#0ea5e9', '#22c55e', '#f59e0b',
          '#64748b', '#06b6d4', '#84cc16', '#fb7185', '#14b8a6',
          '#0284c7', '#ef4444', '#10b981', '#f97316', '#38bdf8',
          '#475569', '#2dd4bf', '#eab308', '#dc2626', '#0891b2'
        ]
      }), true)
    }
  }
}
</script>

<style scoped>
.stats-container {
  margin: 8px auto 0;
  border-radius: 18px;
  width: 100%;
  padding: 22px 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px rgba(15, 23, 42, 0.05);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(240, 253, 250, 0.9));
}

.stats-row {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(13, 148, 136, 0.1);
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(145deg, #ecfeff, #f0fdfa);
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.stat-title {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 4px;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.quick-panel {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px rgba(15, 23, 42, 0.05);
}

.panel-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.panel-head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.quick-item:hover {
  transform: translateY(-2px);
  border-color: #99f6e4;
  background: #fff;
  box-shadow: 0 10px 22px rgba(13, 148, 136, 0.1);
}

.quick-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.quick-icon.teal { background: linear-gradient(135deg, #2dd4bf, #0d9488); }
.quick-icon.blue { background: linear-gradient(135deg, #60a5fa, #2563eb); }
.quick-icon.amber { background: linear-gradient(135deg, #fbbf24, #d97706); }
.quick-icon.rose { background: linear-gradient(135deg, #fb7185, #e11d48); }
.quick-icon.cyan { background: linear-gradient(135deg, #22d3ee, #0891b2); }
.quick-icon.indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
.quick-icon.green { background: linear-gradient(135deg, #4ade80, #16a34a); }
.quick-icon.slate { background: linear-gradient(135deg, #94a3b8, #475569); }

.quick-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quick-text strong {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

.quick-text em {
  margin-top: 2px;
  font-style: normal;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.charts-container {
  width: 100%;
  display: flex;
  margin: 20px auto 0;
  justify-content: space-between;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 20px;
}

.chart-box {
  width: calc(50% - 10px);
  min-width: 360px;
  box-sizing: border-box;
  border-radius: 18px;
  height: 560px;
  padding: 12px 8px 12px 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px rgba(15, 23, 42, 0.05);
  background-color: #fff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  width: 100%;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #0d9488;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 18px;
  font-size: 15px;
  color: #64748b;
}

.error-message {
  text-align: center;
  color: #dc2626;
  font-size: 15px;
  margin-top: 24px;
  padding: 16px 20px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media screen and (max-width: 1200px) {
  .chart-box {
    width: 100%;
    height: 520px;
  }

  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .charts-container {
    flex-direction: column;
  }

  .chart-box {
    width: 100%;
    min-width: 0;
    height: 460px;
  }
}
</style>
