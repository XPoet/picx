import Axios from "axios";
import ElementUI from 'element-ui';

// 接口 URL 前缀
Axios.defaults.baseURL = 'https://api.github.com';

// 前置拦截
Axios.interceptors.request.use(config => {
  return config;
});

// 后置拦截
Axios.interceptors.response.use(response => {
    return response;
  }, error => {
    if (error.response && error.response.data) {
      const code = error.response.status
      const msg = error.response.data.message
      ElementUI.Message.error({
        message: `Code: ${code}, Message: ${msg}`,
        duration: 4000
      })
      console.error(error.response)
    }

    return error.response;
  }
);
