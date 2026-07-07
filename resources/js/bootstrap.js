import axios from 'axios';
window.axios = axios;

window.axios.defaults.baseURL = document.querySelector('meta[name="api-base-url"]')?.content || '';
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
