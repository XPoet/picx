<template>
  <div>
   <h1>coming soon...</h1>
  </div>
</template>

<script>
  import Axios from 'axios'
  import {PICX_KEY} from "../common/model/localStorage";

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
        let config = localStorage.getItem(PICX_KEY)
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
