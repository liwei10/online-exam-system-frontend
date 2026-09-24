<template>
  <div
    v-loading="pageLoading"
    element-loading-text="正在查询请等待"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(232, 242, 239, 0.72)"
    class="app-container student-dashboard page-loading-host"
  >
    <!-- 待考试卷 -->
    <section class="dash-panel exam-panel">
      <div class="panel-head with-action">
        <div>
          <h3>待考试卷</h3>
          <p>即将开始或正在进行中的考试</p>
        </div>
        <el-button type="text" class="more-link" @click="$router.push('/text-center')">查看全部</el-button>
      </div>

      <div v-if="examLoading" class="exam-empty">加载中...</div>
      <div v-else-if="!pendingExams.length" class="exam-empty">
        暂无待考试卷，去
        <a href="javascript:;" @click="$router.push('/text-center')">试卷中心</a>
        看看吧
      </div>
      <div v-else class="exam-grid">
        <div
          v-for="item in pendingExams"
          :key="item.id"
          class="exam-card"
          :class="'status-' + getExamStatus(item).key"
        >
          <span class="exam-ribbon">{{ getExamStatus(item).label }}</span>
          <h4 class="exam-title">{{ item.title }}</h4>
          <div class="exam-meta">
            <span>时长 {{ item.examDuration }} 分钟</span>
            <span>总分 {{ item.grossScore }} / 及格 {{ item.passedScore }}</span>
          </div>
          <div class="exam-time">
            <div><em>开始</em>{{ item.startTime }}</div>
            <div><em>结束</em>{{ item.endTime }}</div>
          </div>
          <div class="exam-footer">
            <span class="countdown" :class="{ urgent: getExamStatus(item).key === 'ongoing' }">
              {{ getCountdownText(item) }}
            </span>
            <el-button
              size="mini"
              :type="getExamStatus(item).btnType"
              :disabled="getExamStatus(item).disabled"
              @click="goExam(item)"
            >{{ getExamStatus(item).btnText }}</el-button>
          </div>
        </div>
      </div>
    </section>

    <div class="bottom-row">
      <div class="dash-panel left">
        <div class="panel-head">
          <h3>登录时长</h3>
          <p>近 15 天学习活跃度</p>
        </div>
        <div ref="charts" class="chart-div" />
      </div>
      <div class="dash-panel right">
        <div class="panel-head">
          <h3>最新公告</h3>
          <p>展开可查看详情</p>
        </div>
        <div class="notice-wrap">
          <el-collapse accordion @change="onNoticeExpand">
            <!-- eslint-disable-next-line vue/no-template-shadow -->
            <div v-for="(item, index) in noticePage.records" :key="index">
              <el-collapse-item
                v-if="item != null"
                :title="item.title"
                :name="index"
              >
                <div v-if="item._loading" class="notice-loading">加载中...</div>
                <div v-else v-html="item.content" />
                <div class="noticeContent">
                  <div>{{ item.realName }}</div>
                  <div>{{ item.createTime }}</div>
                </div>
              </el-collapse-item>
            </div>
            <el-collapse-item
              v-if="noticePage.records.length === 0"
              title="暂无公告"
              name="default"
            >
              <div>目前没有最新公告，请稍后再查看。</div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { noticeGetNew, noticeDetail } from '@/api/notice'
import { getDaily } from '@/api/stat'
import { getGradeExamList } from '@/api/exam'
import echarts from 'echarts'
import pageLoading from '@/mixin/pageLoading'

export default {
  mixins: [pageLoading],
  data() {
    return {
      pageNum: 1,
      pageSize: 10,
      noticePage: { records: [] },
      dateArray: [],
      formattedData: [],
      pendingExams: [],
      examLoading: false,
      nowTick: Date.now(),
      tickTimer: null,
      option: {
        color: ['#14b8a6'],
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.86)',
          borderWidth: 0,
          textStyle: { color: '#fff' }
        },
        grid: {
          left: 40,
          right: 20,
          top: 30,
          bottom: 40
        },
        xAxis: {
          data: [],
          axisLine: { lineStyle: { color: '#cbd5e1' }},
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: {
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' }},
          axisLine: { show: false },
          axisLabel: { color: '#64748b' }
        },
        series: [
          {
            name: '登录时长(分钟)',
            type: 'bar',
            barWidth: '42%',
            itemStyle: {
              barBorderRadius: [6, 6, 0, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#2dd4bf' },
                  { offset: 1, color: '#0d9488' }
                ]
              }
            },
            data: []
          }
        ]
      },
      myChart: null
    }
  },
  created() {
    this.withPageLoading(async() => {
      await this.loadPendingExams()
      this.getDailyFun()
      await this.getNotice(this.pageNum, this.pageSize)
    })
  },
  mounted() {
    this.initCharts()
    window.addEventListener('resize', this.resizeChart)
    this.tickTimer = setInterval(() => {
      this.nowTick = Date.now()
    }, 1000)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart)
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
    }
    if (this.myChart) {
      this.myChart.dispose()
    }
  },
  methods: {
    async loadPendingExams() {
      this.examLoading = true
      try {
        const res = await getGradeExamList({ pageNum: 1, pageSize: 6, isASC: false })
        const records = (res && res.data && res.data.records) || []
        const now = Date.now()
        this.pendingExams = records
          .filter((row) => {
            const end = new Date(row.endTime).getTime()
            return !isNaN(end) && end >= now
          })
          .slice(0, 4)
      } catch (e) {
        this.pendingExams = []
      } finally {
        this.examLoading = false
      }
    },
    getExamStatus(row) {
      const now = this.nowTick
      const endTime = new Date(row.endTime).getTime()
      const startTime = new Date(row.startTime).getTime()
      if (now > endTime) {
        return { key: 'ended', label: '已结束', btnText: '已结束', btnType: 'info', disabled: true }
      }
      if (now < startTime) {
        return { key: 'upcoming', label: '未开始', btnText: '未开始', btnType: 'warning', disabled: true }
      }
      return { key: 'ongoing', label: '考试中', btnText: '开始考试', btnType: 'success', disabled: false }
    },
    formatDuration(ms) {
      if (ms <= 0) return '0 分钟'
      const totalSec = Math.floor(ms / 1000)
      const days = Math.floor(totalSec / 86400)
      const hours = Math.floor((totalSec % 86400) / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      const secs = totalSec % 60
      if (days > 0) return `${days}天 ${hours}小时`
      if (hours > 0) return `${hours}小时 ${mins}分 ${secs}秒`
      return `${mins}分 ${secs}秒`
    },
    getCountdownText(row) {
      const now = this.nowTick
      const endTime = new Date(row.endTime).getTime()
      const startTime = new Date(row.startTime).getTime()
      if (now > endTime) return '考试已结束'
      if (now < startTime) return `距开始 ${this.formatDuration(startTime - now)}`
      return `剩余 ${this.formatDuration(endTime - now)}`
    },
    goExam(row) {
      const status = this.getExamStatus(row)
      if (status.disabled) return
      localStorage.setItem('examInfo_examId', row.id)
      this.$router.push({ name: 'prepare-exam', query: { zhi: row }})
    },
    getDailyFun() {
      getDaily().then((res) => {
        if (res.code === 1) {
          const currentDate = new Date()
          this.dateArray = []
          for (let i = 0; i <= 14; i++) {
            const date = new Date(
              currentDate.getTime() - i * 24 * 60 * 60 * 1000
            )
            this.dateArray.push(date.toISOString().split('T')[0])
          }
          this.dateArray.reverse()

          const dataMap = res.data.reduce((acc, item) => {
            acc[item.loginDate] = item.totalSeconds
            return acc
          }, {})

          this.formattedData = this.dateArray.map((date) => {
            const secondsOnDate = dataMap[date] || 0
            return secondsOnDate / 60
          })

          this.option.xAxis.data = this.dateArray
          this.option.series[0].data = this.formattedData
          this.$nextTick(() => {
            this.initCharts()
          })
        }
      })
    },
    async getNotice(pageNum, pageSize) {
      const params = { pageNum: pageNum, pageSize: pageSize }
      const res = await noticeGetNew(params)
      if (res && res.data) {
        this.noticePage = res.data
      } else {
        this.noticePage = { records: [] }
      }
    },
    async onNoticeExpand(name) {
      if (name === '' || name === 'default' || name == null) {
        return
      }
      const item = this.noticePage.records[name]
      if (!item || item.id == null) {
        return
      }
      if (item.content) {
        return
      }
      this.$set(item, '_loading', true)
      try {
        const res = await noticeDetail(item.id)
        if (res && res.data) {
          this.$set(item, 'content', res.data.content || '')
        }
      } finally {
        this.$set(item, '_loading', false)
      }
    },
    initCharts() {
      if (!this.$refs.charts) return
      this.myChart = echarts.init(this.$refs.charts)
      this.myChart.setOption(this.option)
    },
    resizeChart() {
      if (this.myChart) {
        this.myChart.resize()
      }
    }
  }
}
</script>

<style scoped>
.student-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
  min-height: calc(100vh - 100px);
}

.dash-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.05);
  padding: 18px 20px 16px;
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

.panel-head.with-action {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.more-link {
  color: #0d9488 !important;
  font-weight: 600;
  padding: 0;
}

.exam-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.exam-card {
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 16px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.exam-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.exam-ribbon {
  position: absolute;
  top: 12px;
  right: -28px;
  width: 110px;
  text-align: center;
  transform: rotate(35deg);
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  padding: 4px 0;
  letter-spacing: 0.04em;
}

.status-ongoing .exam-ribbon {
  background: #0d9488;
}

.status-upcoming .exam-ribbon {
  background: #f59e0b;
}

.status-ended .exam-ribbon {
  background: #94a3b8;
}

.exam-title {
  margin: 0 48px 10px 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 10px;
}

.exam-time {
  font-size: 12px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 12px;
}

.exam-time em {
  font-style: normal;
  color: #94a3b8;
  margin-right: 8px;
}

.exam-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}

.countdown {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.countdown.urgent {
  color: #0d9488;
}

.exam-empty {
  margin-top: 18px;
  padding: 28px 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 12px;
}

.exam-empty a {
  color: #0d9488;
  font-weight: 600;
}

.bottom-row {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.bottom-row .left,
.bottom-row .right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.chart-div {
  flex: 1;
  min-height: 320px;
  width: 100%;
  margin-top: 8px;
}

.notice-wrap {
  margin-top: 12px;
  overflow: auto;
  flex: 1;
  max-height: 360px;
}

.noticeContent {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-left: 12px;
  margin-top: 12px;
  color: #94a3b8;
  font-size: 12px;
}

.notice-loading {
  color: #94a3b8;
  font-size: 13px;
}

@media screen and (max-width: 991px) {
  .student-dashboard {
    min-height: calc(100vh - 50px);
    padding: 12px;
    gap: 12px;
  }

  .exam-grid {
    grid-template-columns: 1fr;
  }

  .bottom-row {
    flex-direction: column;
  }

  .chart-div {
    min-height: 240px;
    height: 240px;
  }

  .notice-wrap {
    max-height: none;
  }
}
</style>
