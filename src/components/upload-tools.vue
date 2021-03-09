<template>
  <div>
    <!--<div class="tool-item">
      <el-switch
        v-model="setMaxSize"
        inactive-text="设置上传图片大小(kb)"
        @change="setMaxSizeChange"
        style="margin-right: 20px"
      >
      </el-switch>
      <el-input-number v-model="maxSize"
                       :disabled="!setMaxSize"
                       size="mini"
                       :min="100"
                       :max="1000"
                       :step="50"
                       @change="maxSizeChange"
                       label="图片大小"
      ></el-input-number>
    </div>-->

    <!-- 重命名 -->
    <div class="tool-item" v-if="isShowRename">
      <el-switch
        v-model="isRename"
        active-text="重命名"
        @change="rename"
      >
      </el-switch>
    </div>
    <div class="tool-item" v-if="isShowRename && isRename">
      <el-input placeholder="请输入新的名字"
                v-model="newName"
                size="small"
                @input="rename"
                :clearable="true"
      >
      </el-input>
    </div>

    <!-- 哈希命名 -->
    <div class="tool-item" v-if="isShowHashName">
      <el-switch
        v-model="isHashRename"
        active-text="哈希命名"
        @change="hashRename"
      >
      </el-switch>
    </div>

    <!-- Markdown -->
    <div class="tool-item" v-if="isShowTransformMarkdown">
      <el-switch
        v-model="isTransformMarkdown"
        active-text="外链转换Markdown格式"
        @change="transformMarkdown"
      >
      </el-switch>
    </div>

    <div class="tool-item operation-btn">
      <el-button plain
                 icon="el-icon-refresh"
                 @click="uploadReset"
      >重置
      </el-button>
      <el-button type="primary"
                 plain
                 icon="el-icon-upload"
                 @click="uploadFile"
      >上传
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, reactive, toRefs, onMounted, watch} from 'vue'

export default defineComponent({
  name: "UploadTools",

  props: {
    isShowRename: {
      type: Boolean,
      default: false
    },
    isShowHashName: {
      type: Boolean,
      default: false
    },
    isShowTransformMarkdown: {
      type: Boolean,
      default: false
    }
  },

  setup(props, context) {

    const reactiveData = reactive({
      setMaxSize: false,
      maxSize: 200,
      isRename: false,
      isHashRename: true,
      isTransformMarkdown: false,
      newName: '',

      // 重命名
      innerRename(isRename?: any) {
        context.emit('rename', {isRename: this.isRename, newName: this.newName})
      },

      // 哈希命名
      innerHashRename(e: any) {
        context.emit('hash-named', e)
      },

      // transform markdown
      innerTransformMarkdown(e: any) {
        context.emit('transform-markdown', e)
      },

      setMaxSizeChange(e: any) {
        context.emit('is-set-max-size', e)
      },

      maxSizeChange(e: any) {
        context.emit('max-size', e)
      },

      // 重置
      innerUploadReset() {
        context.emit('upload-reset')
      },

      // 上传
      innerUploadFile() {
        context.emit('upload-file')
      }
    })

    onMounted(() => {
      hashRename(reactiveData.isHashRename)
      rename(reactiveData.isRename)
      reactiveData.setMaxSizeChange(reactiveData.setMaxSize)
      reactiveData.maxSizeChange(reactiveData.maxSize)
    })

    watch(() => props.isShowRename, (_n, _o) => {
      reactiveData.isRename = false
      if (_n) {
        reactiveData.newName = 'xxx'
      } else {
        reactiveData.newName = ''
      }
    })

    const rename = (e: any) => {
      reactiveData.innerRename()
    }

    const hashRename = (e: any) => {
      reactiveData.innerHashRename(e)
    }

    const transformMarkdown = (e: any) => {
      reactiveData.innerTransformMarkdown(e)
    }

    const uploadReset = () => {
      reactiveData.innerUploadReset()
    }

    const uploadFile = () => {
      reactiveData.innerUploadFile()
    }

    return {
      ...toRefs(reactiveData),
      hashRename,
      rename,
      transformMarkdown,
      uploadReset,
      uploadFile,
    }

  },
})
</script>

<style scoped lang="stylus">

.tool-item {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.operation-btn {
  justify-content: flex-end;
}

</style>
