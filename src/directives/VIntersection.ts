import { DirectiveBinding } from "vue";

export default {
  name: "intersection",
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    new IntersectionObserver(callback.bind(this), {
      rootMargin: "0px",
      threshold: 1.0,
    }).observe(el);

    function callback(entries: Array<IntersectionObserverEntry>) {
      if (entries[0].isIntersecting) {
        binding.value();
      }
    }
  },
};
