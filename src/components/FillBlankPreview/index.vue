<template>
  <div class="fill-blank-preview">
    <p v-if="stemText" class="preview-stem">{{ stemText }}</p>
    <p v-else class="preview-empty">暂无题干内容</p>

    <div v-if="image" class="preview-image-wrap">
      <el-image :src="image" :preview-src-list="[image]" class="preview-image" fit="contain" />
    </div>

    <audio-player :src="audio" />

    <div v-if="blankCount > 0" class="fill-blank-area">
      <div
        v-for="idx in blankCount"
        :key="'preview-fill-' + idx"
        class="fill-blank-row"
      >
        <span class="fill-blank-label">空{{ idx }}：</span>
        <el-input
          :value="previewAnswers[idx - 1]"
          placeholder="请输入该空答案"
          clearable
          @input="onAnswerInput(idx - 1, $event)"
        />
      </div>
    </div>
    <p v-else class="preview-empty">题干中尚未检测到填空占位符</p>

    <div v-if="showAnswerHint && answerHints.length" class="preview-answer-hint">
      <div class="preview-answer-hint-title">标准答案（仅预览可见，学生端不显示）</div>
      <div
        v-for="(hint, i) in answerHints"
        :key="'hint-' + i"
        class="preview-answer-hint-row"
      >
        空{{ i + 1 }}：{{ hint || '（未填写）' }}
      </div>
    </div>
  </div>
</template>

<script>
import AudioPlayer from '@/components/AudioPlayer'
import { countBlanks, renderStemWithBlanks } from '@/utils/blankPlaceholder'

export default {
  name: 'FillBlankPreview',
  components: { AudioPlayer },
  props: {
    content: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    audio: {
      type: [String, Array],
      default: ''
    },
    /** 答案行，元素可为 string 或 { content } */
    options: {
      type: Array,
      default: () => []
    },
    /** 是否展示标准答案提示（教师预览用） */
    showAnswerHint: {
      type: Boolean,
      default: true
    },
    /** 题号前缀，如 1. */
    sortPrefix: {
      type: String,
      default: '1.'
    }
  },
  data() {
    return {
      previewAnswers: []
    }
  },
  computed: {
    blankCount() {
      return countBlanks(this.content)
    },
    stemText() {
      if (!this.content) return ''
      return this.sortPrefix + renderStemWithBlanks(this.content)
    },
    answerHints() {
      return (this.options || []).map(opt => {
        if (opt == null) return ''
        if (typeof opt === 'string') return opt
        return opt.content != null ? String(opt.content) : ''
      })
    }
  },
  watch: {
    blankCount: {
      immediate: true,
      handler(n) {
        const next = []
        for (let i = 0; i < n; i++) {
          next.push(this.previewAnswers[i] != null ? this.previewAnswers[i] : '')
        }
        this.previewAnswers = next
      }
    }
  },
  methods: {
    onAnswerInput(index, val) {
      this.$set(this.previewAnswers, index, val)
    }
  }
}
</script>

<style scoped>
.fill-blank-preview {
  color: #334155;
  line-height: 1.7;
}

.preview-stem {
  margin: 0 0 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
  color: #1e293b;
}

.preview-empty {
  margin: 0 0 12px;
  color: #94a3b8;
  font-size: 13px;
}

.preview-image-wrap {
  margin-bottom: 12px;
}

.preview-image {
  max-width: 100%;
  max-height: 280px;
}

.fill-blank-area {
  margin-top: 12px;
}

.fill-blank-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.fill-blank-label {
  flex-shrink: 0;
  width: 56px;
  color: #334155;
}

.preview-answer-hint {
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  font-size: 13px;
}

.preview-answer-hint-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #64748b;
}

.preview-answer-hint-row {
  color: #475569;
  line-height: 1.6;
}
</style>
