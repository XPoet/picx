<template>
  <div>
   <h1>coming soon...</h1>
  </div>
</template>

<script>
  import Axios from 'axios'
  import {picx_key} from "../utils/localStorage";

  export default {
    name: "Management",

    data() {
      return {
        userConfigInfo: null
      }
    },

    mounted() {
      this.getUserConfigInfo()
    },

    methods: {

      getUserConfigInfo() {
        let config = localStorage.getItem(picx_key)
        if (config) {
          this.userConfigInfo = JSON.parse(config)
        }
      },

      getReposInfo() {
        if (this.userConfigInfo) {

          Axios.get(`https://api.github.com/repos/${this.userConfigInfo?.username}/${this.userConfigInfo?.selectedRepos}/contents`)
            .then(res => {
              console.log('res', res);
            })

        }



      }
    }
  }
</script>

<style scoped>

</style>
