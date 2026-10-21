<script setup lang="ts">
import BrandLogo from '@/components/brand-logo/brand-logo.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-brand">
        <BrandLogo />
      </div>
      <nav class="footer-links" :aria-label="$t('footer.links')">
        <a href="https://picx-docs.xpoet.cn" target="_blank" rel="noopener noreferrer">
          <PicxIcon name="book-open" :size="18" />
          {{ $t('footer.help') }}
        </a>
        <a href="https://github.com/XPoet/picx/issues" target="_blank" rel="noopener noreferrer">
          <PicxIcon name="info" :size="18" />
          {{ $t('footer.feedback') }}
        </a>
      </nav>
    </div>
  </footer>
</template>

<style scoped lang="stylus">
.site-footer {
  flex-shrink 0
  width 100%
  border-top 1px solid var(--picx-color-border)

  .footer-content {
    display flex
    align-items center
    justify-content space-between
    box-sizing border-box
    gap var(--picx-space-6)
    width calc(100% - 64px)
    max-width var(--picx-content-max-width)
    margin 0 auto
    padding 24px 0
  }

  .footer-links {
    display flex
    flex-wrap wrap
    gap var(--picx-space-6)

    a {
      display inline-flex
      align-items center
      justify-content center
      gap var(--picx-space-2)
      min-width 44px
      min-height var(--picx-control-height)
      color var(--picx-color-text-muted)
      font-size var(--picx-font-body)
      border-radius 8px

      &:hover {
        color var(--picx-color-primary)
      }
    }
  }

  @media (max-width $picx-mobile-breakpoint) {
    .footer-content {
      flex-direction column
      align-items flex-start
      gap var(--picx-space-3)
      width calc(100% - 32px)
    }
  }
}
</style>
