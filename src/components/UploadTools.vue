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
        @change="rename()"
      >
      </el-switch>
    </div>
    <div class="tool-item" v-if="isShowRename && isRename">
      <el-input placeholder="请输入新的名字"
                v-model="newName"
                size="small"
                @input="rename()"
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
      >重置</el-button>
      <el-button type="primary"
                 plain
                 icon="el-icon-upload"
                 @click="uploadFile"
      >上传</el-button>
    </div>
  </div>
</template>

<script>
  export default {
    name: "UploadTools",

    data() {
      return {
        setMaxSize: false,
        maxSize: 200,
        isRename: false,
        isHashRename: true,
        isTransformMarkdown: false,
        newName: '',
      }
    },

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

    mounted() {
      this.hashRename(this.isHashRename)
      this.rename(this.isRename)
      this.setMaxSizeChange(this.setMaxSize)
      this.maxSizeChange(this.maxSize)
    },

    watch: {
      isShowRename(e) {
        this.isRename = false
        if (e) {
          this.newName = 'xxx'
        } else {
          this.newName = ''
        }
      }
    },


    methods: {
      // 重命名
      rename() {
        this.$emit('rename', {isRename: this.isRename, newName: this.newName})
      },

      // 哈希命名
      hashRename(e) {
        this.$emit('hash-named', e)
      },

      // transform markdown
      transformMarkdown(e) {
        this.$emit('transform-markdown', e)
      },

      setMaxSizeChange(e) {
        this.$emit('is-set-max-size', e)
      },

      maxSizeChange(e) {
        this.$emit('max-size', e)
      },

      // 重置
      uploadReset() {
        this.$emit('upload-reset')
      },

      // 上传
      uploadFile() {
        this.$emit('upload-file')
      }

    },
  }
</script>

<style scoped lang="scss">

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
