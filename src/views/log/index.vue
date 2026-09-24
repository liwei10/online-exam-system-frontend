<template>
  <div
    v-loading="pageLoading"
    element-loading-text="正在查询请等待"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(232, 242, 239, 0.72)"
    class="app-container page-loading-host">
    <el-table class="flex-list-table"
      :data="data.records"
      border
      fit
      highlight-current-row
      :header-cell-style="{
        background: '#eef6f3',
        color: '#555',
        'font-weight': 'bold',
        'line-height': '32px',
      }"
    >
      <el-table-column class-name="datetime-col"
        prop="createTime"
        label="登录时间"
        align="center"
        min-width="250"
      />
      <el-table-column min-width="120" prop="place" label="登录地点" align="center" />
      <el-table-column min-width="120" prop="device" label="登录设备" align="center" />
      <el-table-column prop="behavior" label="操作行为" align="center">
        <template slot-scope="{ row }">
          <span :style="{ color: getBehaviorColor(row.behavior) }">{{
            row.behavior
          }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="data.current"
        :page-sizes="[10, 20, 30, 40]"
        :page-size="data.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="data.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { getLogPage } from "@/api/log";
import pageLoading from '@/mixin/pageLoading'
export default {
  mixins: [pageLoading],
  data() {
    return {
      tableData: [
        { behavior: "设备登录" },
        { behavior: "设备登出" },
        { behavior: "登录失败" },
      ],
      pageNum: 1,
      pageSize: 10,
      data: {},
    };
  },
  created() {
    this.getLogPageFun();
  },
  methods: {
    // 获取不同类型的颜色
    getBehaviorColor(behavior) {
      if (behavior === "设备登录") {
        return "green";
      } else if (behavior === "设备登出") {
        return "orange";
      } else if (behavior === "登录失败") {
        return "red";
      }
      return "black"; // 默认颜色
    },
    // 分页查询
    async getLogPageFun(pageNum, pageSize, title = null) {

      await this.withPageLoading(async () => {
        const params = { pageNum: pageNum, pageSize: pageSize };
        const res = await getLogPage(params);
        this.data = res.data;

      })

      },

    handleSizeChange(val) {
      // 设置每页多少条逻辑
      this.pageSize = val;
      this.getLogPageFun(this.pageNum, val);
    },
    handleCurrentChange(val) {
      // 设置当前页逻辑
      this.pageNum = val;
      this.getLogPageFun(val, this.pageSize);
    },
  },
};
</script>
