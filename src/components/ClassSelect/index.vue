<template>
  <el-select
    v-model="selectedClassIds"
    :multiple="isMultiple"
    filterable
    clearable
    :disabled="isEdit"
    placeholder="选择或搜索班级"
    class="class-selector"
    @change="handleClassChange"
  >
    <el-option
      v-for="cls in classList"
      :key="cls.id"
      :label="cls.gradeName"
      :value="cls.id"
    />
  </el-select>
</template>

<script>
import { fetchClasses } from '@/api/class_'

export default {
  name: 'ClassSelect',
  props: {
    isMultiple: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    // eslint-disable-next-line vue/require-default-prop
    value: [String, Number, Array],
    // eslint-disable-next-line vue/require-default-prop
    excludes: Array
  },
  data() {
    return {
      classList: [],
      selectedClassIds: this.isMultiple ? [] : ''
    }
  },
  watch: {
    value: {
      handler(newValue) {
        if (this.isMultiple) {
          this.selectedClassIds = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : [])
        } else {
          this.selectedClassIds = Array.isArray(newValue) ? (newValue[0] || '') : (newValue || '')
        }
      },
      immediate: true
    }
  },
  created() {
    this.loadClasses()
  },
  methods: {
    loadClasses() {
      fetchClasses().then((response) => {
        let list = response.data || []
        if (this.excludes && this.excludes.length) {
          list = list.filter((cls) => !this.excludes.includes(cls.id))
        }
        this.classList = list
      })
    },
    handleClassChange(selectedIds) {
      const idsArray = Array.isArray(selectedIds)
        ? selectedIds
        : (selectedIds === '' || selectedIds == null ? [] : [selectedIds])
      const selectedClasses = this.classList.filter((cls) => idsArray.includes(cls.id))
      this.$emit('change', selectedClasses)
      this.$emit('input', selectedIds)
    }
  }
}
</script>

<style scoped>
.class-selector {
  width: 100%;
}
</style>
