<template>
  <el-dialog title="是否压缩图片？" :model-value="dialogVisible" width="50%">
    <div>
      <el-form ref="form" label-width="180px">
        <el-form-item label="原图大小（KB）">
          <el-input
            :model-value="(imageInfoObject.fileInfo.size / 1024).toFixed(2)"
            readonly
          ></el-input>
        </el-form-item>
        <el-form-item label="设置分辨率百分比（%）">
          <el-input
            v-model="resolutionRatio"
            max="100"
            min="30"
            clearable
            type="number"
          ></el-input>
        </el-form-item>
        <el-form-item label="设置图片压缩质量">
          <el-input
            v-model="compressQuality"
            max="1"
            min="0.2"
            clearable
            step="0.1"
            type="number"
          ></el-input>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button size="mini" @click="handleClose">取 消</el-button>
        <el-button size="mini" type="primary" @click="confirmCompress"
          >确定压缩</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from 'vue'
import { compress } from '@/common/utils/compressImage'

export default defineComponent({
  name: 'compress-image-dialog',

  emits: ['closeDialog'],

  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },

    imageInfoObject: {
      type: Object,
      default: () => {}
    }
  },

  setup(props, context) {
    const handleClose = () => {
      context.emit('closeDialog')
    }

    const rd = reactive({
      setMaxSize: 50,
      compressQuality: 0.5,
      resolutionRatio: 50,

      confirmCompress() {
        compress(
          props.imageInfoObject.imgData.base64Url,
          rd.resolutionRatio / 100,
          rd.compressQuality
        ).then((dataURL) => {
          console.log('compressedBase64', dataURL)
        })
      }
    })

    return {
      ...toRefs(rd),
      handleClose
    }
  }
})
</script>

<style scoped lang="stylus"></style>
