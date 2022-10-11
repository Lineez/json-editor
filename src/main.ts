import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./registerServiceWorker";
import directives from "@/directives/index";
import router from "@/router/index";

// APP
const app = createApp(App);

// register global directives
directives.forEach((directive) => {
  app.directive(directive.name, directive);
});

// STORE
const pinia = createPinia();
// // global store prop
// function SecretPiniaPlugin() {
//     return { secret: "the cake is a lie" };
// }
// pinia.use(SecretPiniaPlugin);

// // in another file
// const store = useStore()
// store.secret // 'the cake is a lie'

app.use(router).use(pinia).mount("#app");
