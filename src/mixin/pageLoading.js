/**
 * 页面数据加载悬浮层：正在查询请等待
 * 在根节点加：
 * v-loading="pageLoading"
 * element-loading-text="正在查询请等待"
 * element-loading-spinner="el-icon-loading"
 * element-loading-background="rgba(232, 242, 239, 0.72)"
 * class="page-loading-host"
 */
export const PAGE_LOADING_ATTRS = {
  text: '正在查询请等待',
  spinner: 'el-icon-loading',
  background: 'rgba(232, 242, 239, 0.72)'
}

export default {
  data() {
    return {
      pageLoading: false
    }
  },
  methods: {
    async withPageLoading(task) {
      this.pageLoading = true
      try {
        return await task()
      } finally {
        this.pageLoading = false
      }
    }
  }
}
