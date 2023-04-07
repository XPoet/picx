<template>
  <div class="page-container settings-page-container">
    <div class="setting-title">上传设置：</div>
    <ul class="setting-list">
      <li class="setting-item upload-settings">
        <el-switch
          v-model="userSettings.defaultHash"
          @change="persistUserSettings"
          active-text="图片名自动哈希化"
        ></el-switch>
        <span class="desc">上传前自动给图片名加上哈希码，确保图片名唯一，强烈建议开启</span>
      </li>
      <li class="setting-item upload-settings">
        <el-switch
          v-model="userSettings.defaultPrefix"
          @change="persistUserSettings"
          active-text="添加图片名前缀"
        ></el-switch>
        <span class="desc">上传前给图片名加上配置的前缀，示例：abc-image.jpg，abc- 为前缀</span>
      </li>
      <li class="setting-item upload-settings" v-if="userSettings.defaultPrefix">
        <el-input
          class="prefix-input"
          v-model="userSettings.prefixName"
          placeholder="请输入命名前缀"
          @input="persistUserSettings"
          clearable
          autofocus
        ></el-input>
      </li>
      <li class="setting-item upload-settings">
        <el-switch
          v-model="userSettings.enableImageLinkFormat"
          @change="persistUserSettings"
          active-text="转换图片链接格式"
        ></el-switch>
        <span class="desc">
          上传成功后复制的图片链接时启用 {{ userSettings.imageLinkFormat.selected }} 格式
        </span>
      </li>
      <li class="setting-item upload-settings">
        <el-switch
          v-model="userSettings.defaultWatermark"
          @change="persistUserSettings"
          active-text="添加水印"
        ></el-switch>
        <span class="desc"> 自定义水印文字、字体大小、位置和透明度 </span>
      </li>
      <el-card v-if="userSettings.defaultWatermark">
        <el-form label-position="left" label-width="120px" size="default">
          <el-form-item label="水印文字">
            <el-input
              v-model="userSettings.watermarkSettings.text"
              clearable
              maxlength="8"
              @input="persistUserSettings"
            />
          </el-form-item>
          <el-form-item label="水印字体大小">
            <el-input-number
              v-model="userSettings.watermarkSettings.fontSize"
              :min="30"
              :max="50"
              @change="persistUserSettings"
            />
          </el-form-item>
          <el-form-item label="水印位置">
            <el-radio-group
              v-model="userSettings.watermarkSettings.position"
              @change="persistUserSettings"
            >
              <el-radio label="top-left">左上角</el-radio>
              <el-radio label="top-right">右上角</el-radio>
              <el-radio label="bottom-left">左下角</el-radio>
              <el-radio label="bottom-right">右下角</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="水印透明度">
            <el-input-number
              v-model="userSettings.watermarkSettings.opacity"
              :precision="2"
              :step="0.1"
              :min="0"
              :max="1"
              @change="persistUserSettings"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </ul>

    <div class="setting-title">图片链接规则配置：</div>
    <ul class="setting-list">
      <li class="setting-item cdn">
        <el-select
          v-model="userSettings.imageLinkType.selected"
          placeholder="选择一个图片链接类型规则"
          @change="saveUserSettings"
        >
          <el-option
            v-for="item in userSettings.imageLinkType.presetList"
            :key="item.name + '-' + item.id"
            :label="item.name"
            :value="item.name"
            class="image-link-type-rule-option"
          >
            <span class="left">{{ item.name }}</span>
            <span class="right">{{ item.rule }}</span>
          </el-option>
        </el-select>
        <el-tooltip :content="(isAddRule ? '关闭' : '新增') + '自定义图片链接规则'" placement="top">
          <el-icon class="add-image-link-type-rule" @click="toggleShowImageLinkRuleCard">
            <Remove v-if="isAddRule" />
            <CirclePlus v-else />
          </el-icon>
        </el-tooltip>
      </li>
      <li class="setting-item" v-if="isAddRule">
        <image-link-rule-config />
      </li>
    </ul>

    <div class="setting-title">图片链接格式设置：（例如：Markdown、HTML）</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-select
          v-model="userSettings.imageLinkFormat.selected"
          placeholder="选择一个图片链接格式"
          @change="saveUserSettings"
        >
          <el-option
            v-for="item in userSettings.imageLinkFormat.presetList"
            :key="item.name"
            :label="item.name"
            :value="item.name"
            class="image-link-type-rule-option"
          >
            <span class="left">{{ item.name }}</span>
            <span class="right">{{ item.format }}</span>
          </el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title">压缩设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userSettings.isCompress"
          @change="persistUserSettings"
          active-text="是否压缩图片"
        ></el-switch>
      </li>
      <li class="setting-item">
        <div class="img-encoder-title">选择图像编码器（压缩算法）：</div>
        <el-radio-group
          class="img-encoder-group"
          :disabled="!userSettings.isCompress"
          v-model="userSettings.compressEncoder"
          @change="persistUserSettings"
        >
          <el-radio :label="compressEncoder.webP">
            {{ compressEncoder.webP }}
            <span class="desc">压缩后图片格式为 webp，压缩率较高，大多数浏览器支持</span>
          </el-radio>
          <el-radio :label="compressEncoder.mozJPEG">
            {{ compressEncoder.mozJPEG }}
            <span class="desc">压缩后图片格式为 jpg，兼容性最好</span>
          </el-radio>
          <el-radio :label="compressEncoder.avif">
            {{ compressEncoder.avif }}
            <span class="desc">压缩后图片格式为 avif，压缩率最高，目前仅谷歌浏览器支持</span>
          </el-radio>
        </el-radio-group>
      </li>
    </ul>

    <div class="setting-title">主题设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-select
          v-model="userSettings.themeMode"
          placeholder="主题模式"
          @change="saveUserSettings"
        >
          <el-option label="自动设置" value="auto"></el-option>
          <el-option label="暗夜主题" value="dark"></el-option>
          <el-option label="白昼主题" value="light"></el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title" v-if="userSettings.themeMode === 'auto'">设置白昼模式时间区间：</div>
    <ul class="setting-list" v-if="userSettings.themeMode === 'auto'">
      <li class="setting-item">
        <el-form ref="form">
          <el-form-item>
            <el-time-select
              v-model="userSettings.autoLightThemeTime[0]"
              start="00:00"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
            <span class="time-middle-space"> ~ </span>
            <el-time-select
              v-model="userSettings.autoLightThemeTime[1]"
              :start="userSettings.autoLightThemeTime[0]"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
          </el-form-item>
        </el-form>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { store } from '@/store'
import { CompressEncoderEnum } from '@/common/model'
import ImageLinkRuleConfig from '@/components/image-link-rule-config/image-link-rule-config.vue'

const userSettings = computed(() => store.getters.getUserSettings).value
const isAddRule = ref<boolean>(false)

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const compressEncoder = CompressEncoderEnum

const saveUserSettings = () => {
  store.dispatch('SET_USER_SETTINGS', {
    ...userSettings
  })
  persistUserSettings()
}

const toggleShowImageLinkRuleCard = () => {
  isAddRule.value = !isAddRule.value
}
</script>

<style scoped lang="stylus">
@import "my-settings.styl"
</style>
