<template>
  <main>
    <div v-if="!this.$options.myJson" class="json" ref="json"></div>
    <button
      class="btn"
      title="method destroy all listeners and DOM element"
      @click="this.$options.myJson.destroy()"
    >
      Destroy
    </button>
    <button
      class="btn"
      title="method get json as object"
      @click="showJSON(this.$options.myJson.getJSON())"
    >
      getJSON (show in alert)
    </button>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { JsonViewer } from "@/utils/json";

export default defineComponent({
  methods: {
    upload(): Promise<unknown> {
      return new Promise((resolve, reject) => {
        try {
          const response = fetch(
            "https://jsonplaceholder.typicode.com/users/1"
          );
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    showJSON(str: string): void {
      alert(JSON.stringify(str));
    },
  },
  mounted() {
    this.upload()
      .then((response: any) => {
        return response.json();
      })
      .then((json: any) => {
        this.$options.myJson = new JsonViewer();
        (this.$refs.json as any).append(this.$options.myJson.init(json));
      });
  },
});
</script>

<style lang="scss">
.json {
  display: inline-block;
  padding: 50px 0;
  &::before {
    content: "{";
  }
  &::after {
    content: "}";
  }

  div {
    margin-left: 0.5rem;
    &.node:not(.object) {
      display: flex;
      column-gap: 0.5rem;
    }
    &.node {
      line-height: 1.25;
      .property {
        &::after {
          content: ":";
        }
      }
      // &.object {
      // }
    }
  }

  [data-property],
  [data-type] {
    cursor: pointer;
  }
  [data-type] {
    &:focus {
      outline: 1px solid currentColor;
    }
  }
  [data-type="number"] {
    color: blueviolet;
  }
  [data-type="string"] {
    color: teal;
  }
  [data-type="array"] {
    // &:not(:focus) {
    //   &::before {
    //     content: "[";
    //   }
    //   &::after {
    //     content: "]";
    //   }
    // }
    color: red;
  }
  [data-type="object"] {
    &:not(:focus) {
      &::before {
        content: "{";
      }
      &::after {
        content: "}";
      }
    }

    div {
      margin-left: 0.5rem;
    }
    &.hide {
      &::before {
        content: "{ ... ";
      }
      div {
        display: none;
      }
    }
  }
  [data-type="boolean"] {
    color: orange;
  }
  [data-type="null"] {
    color: gray;
  }
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid teal;
}
</style>
