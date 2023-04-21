<template>
  <div class="page-container settings-page-container">
    <div class="setting-title">图片名称设置：</div>
    <ul class="setting-list">
      <li class="setting-item has-desc">
        <el-switch
          v-model="userSettings.defaultHash"
          @change="persistUserSettings"
          active-text="自动哈希化"
        ></el-switch>
        <span class="desc">上传前自动给图片名增加哈希码，确保图片名唯一，强烈建议开启</span>
      </li>
      <li class="setting-item has-desc">
        <el-switch
          v-model="userSettings.prefixNaming.enable"
          @change="persistUserSettings"
          active-text="添加前缀命名"
        ></el-switch>
        <span class="desc">上传前自动给图片名增加前缀，例如：abc-image.jpg，abc- 为前缀</span>
      </li>
      <li class="setting-item has-desc" v-if="userSettings.prefixNaming.enable">
        <el-input
          class="prefix-input"
          v-model="userSettings.prefixNaming.prefix"
          placeholder="请输入命名前缀"
          @input="persistUserSettings"
          clearable
          autofocus
        ></el-input>
      </li>
    </ul>

    <el-divider />

    <div class="setting-title">水印设置：</div>
    <ul class="setting-list">
      <li class="setting-item has-desc">
        <el-switch
          v-model="userSettings.watermark.enable"
          @change="persistUserSettings"
          active-text="是否添加水印"
        ></el-switch>
        <span class="desc">开启后可以自定义水印文字、字体大小、位置和透明度</span>
      </li>
      <li class="setting-item" v-if="userSettings.watermark.enable">
        <el-card>
          <el-form label-position="left" label-width="120rem">
            <el-form-item label="水印文字">
              <el-input
                v-model="userSettings.watermark.text"
                clearable
                maxlength="20"
                @input="persistUserSettings"
              />
            </el-form-item>
            <el-form-item label="字体大小">
              <el-input-number
                v-model="userSettings.watermark.fontSize"
                :min="40"
                :max="60"
                :step="2"
                @change="persistUserSettings"
              />
            </el-form-item>
            <el-form-item label="水印位置">
              <el-radio-group
                v-model="userSettings.watermark.position"
                @change="persistUserSettings"
              >
                <el-radio :label="WatermarkPositionEnum.leftTop">左上角</el-radio>
                <el-radio :label="WatermarkPositionEnum.leftBottom">左下角</el-radio>
                <el-radio :label="WatermarkPositionEnum.rightTop">右上角</el-radio>
                <el-radio :label="WatermarkPositionEnum.rightBottom">右下角</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="水印颜色">
              <el-color-picker
                v-model="userSettings.watermark.textColor"
                @active-change="persistUserSettings"
              />
            </el-form-item>
            <el-form-item label="水印透明度">
              <el-input-number
                v-model="userSettings.watermark.opacity"
                :precision="1"
                :step="0.1"
                :min="0.1"
                :max="0.9"
                @change="persistUserSettings"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </li>
    </ul>

    <el-divider />

    <div class="setting-title">压缩设置：</div>
    <ul class="setting-list">
      <li class="setting-item has-desc">
        <el-switch
          v-model="userSettings.compress.enable"
          @change="persistUserSettings"
          active-text="是否压缩图片"
        ></el-switch>
        <span class="desc">开启后上传前会自动压缩图片，有效缩短图片加载时间，强烈建议开启</span>
      </li>
      <li class="setting-item" v-if="userSettings.compress.enable">
        <el-card>
          <compress-config-box
            ref="compressConfigBoxRef"
            style="margin-top: 10rem"
            @encoder=";(userSettings.compress.encoder = $event), persistUserSettings()"
          />
        </el-card>
      </li>
    </ul>

    <el-divider />

    <div class="setting-title">图片链接规则配置：</div>
    <ul class="setting-list">
      <li class="setting-item cdn">
        选择图片链接规则：
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
      </li>
      <li class="setting-item has-desc">
        <el-switch v-model="isAddRule" active-text="自定义图片链接规则"></el-switch>
        <span class="desc">开启后可以新增和管理自定义图片链接规则</span>
      </li>
      <li class="setting-item" v-if="isAddRule">
        <image-link-rule-config />
      </li>
    </ul>

    <el-divider />

    <div class="setting-title">图片链接格式设置：</div>
    <ul class="setting-list">
      <li class="setting-item has-desc">
        <el-switch
          v-model="userSettings.imageLinkFormat.enable"
          @change="persistUserSettings"
          active-text="自动转换图片链接格式"
        ></el-switch>
        <span class="desc">
          上传成功后复制的图片链接时使用 {{ userSettings.imageLinkFormat.selected }} 格式
        </span>
      </li>
      <li class="setting-item">
        选择图片链接格式：
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

    <el-divider />

    <div class="setting-title">主题设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        选择主题模式：
        <el-select
          v-model="userSettings.theme.mode"
          placeholder="主题模式"
          @change="saveUserSettings"
        >
          <el-option label="暗夜主题" :value="ThemeModeEnum.dark"></el-option>
          <el-option label="白昼主题" :value="ThemeModeEnum.light"></el-option>
          <el-option label="自动设置" :value="ThemeModeEnum.auto"></el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title" v-if="userSettings.theme.mode === ThemeModeEnum.auto">
      设置白昼模式时间区间：
    </div>
    <ul class="setting-list" v-if="userSettings.theme.mode === ThemeModeEnum.auto">
      <li class="setting-item">
        <el-form ref="form">
          <el-form-item>
            <el-time-select
              v-model="userSettings.theme.autoLightTime[0]"
              start="00:00"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
            <span class="time-middle-space"> ~ </span>
            <el-time-select
              v-model="userSettings.theme.autoLightTime[1]"
              :start="userSettings.theme.autoLightTime[0]"
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
import { ThemeModeEnum, WatermarkPositionEnum } from '@/common/model'

const userSettings = computed(() => store.getters.getUserSettings).value
const isAddRule = ref<boolean>(false)

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const saveUserSettings = () => {
  store.dispatch('SET_USER_SETTINGS', {
    ...userSettings
  })
  persistUserSettings()
}
</script>

<style scoped lang="stylus">
@import "my-settings.styl"
</style>
