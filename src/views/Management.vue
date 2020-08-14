<template>
  <div>
    <el-button @click="getUserInfo"
    >getUserInfo
    </el-button>
  </div>
</template>

<script>

  import Axios from 'axios'

  export default {
    name: "Management",

    data() {
      return {}
    },

    mounted() {


    },

    methods: {

      getUserInfo() {

        let config = localStorage.getItem('PICX')
        if (config) {
          config = JSON.parse(config)
        }
        Axios.get(
          'https://api.github.com/user',
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${config.token}`
            }
          }
        ).then(res => {
          console.log('res', res);
        })
      },

      getRepos() {

        Axios.get('https://api.github.com/repos/XPoet/xpoet-image-hosting/contents')
          .then(res => {
            console.log('res', res);
          })

      }
    }
  }
</script>

<style scoped>

</style>
