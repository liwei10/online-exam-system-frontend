<template>
  <div v-if="src" class="audio-player">
    <audio ref="player" :src="src" preload="none" @play="playing = true" @pause="playing = false" @ended="playing = false" />
    <el-button
      type="primary"
      size="mini"
      :icon="playing ? 'el-icon-video-pause' : 'el-icon-video-play'"
      @click="toggle"
    >
      {{ playing ? '暂停' : '播放' }}
    </el-button>
    <span class="audio-name">MP3 音频</span>
  </div>
</template>

<script>
export default {
  name: 'AudioPlayer',
  props: {
    src: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      playing: false
    }
  },
  watch: {
    src() {
      this.playing = false
      if (this.$refs.player) {
        this.$refs.player.pause()
      }
    }
  },
  methods: {
    toggle() {
      const player = this.$refs.player
      if (!player) {
        return
      }
      if (player.paused) {
        player.play()
      } else {
        player.pause()
      }
    }
  }
}
</script>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  margin: 8px 0 12px;
}
.audio-name {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
</style>
