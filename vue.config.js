module.exports = {
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
                    @import "@/assets/scss/default/style.scss";
                `,
      },
    },
  },
};
