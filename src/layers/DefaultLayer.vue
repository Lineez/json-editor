<template>
  <header-comp />
  <router-view />
  <footer-comp />
</template>

<script lang="ts">
import FooterComp from "@/components/FooterComp.vue";
import HeaderComp from "@/components/HeaderComp.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: { FooterComp, HeaderComp },
});
</script>

<style lang="scss"></style>
