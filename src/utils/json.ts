interface SelectOption {
  name: string;
  value: string;
}

interface SelectGroupOption {
  label: string;
  options: SelectOption[];
}

export class JsonViewer {
  private jsonViewer: any; // result node tree
  private select: any; // context menu
  private target: any; // target selected node

  constructor() {
    //
  }
  public init(textJson: string): HTMLElement {
    const json = this.getJsonOrError(textJson);
    const generate = this.generate(json);

    generate.addEventListener("click", this.clickHandler.bind(this));
    // поскольку blur не всплывает, используем focusout
    generate.addEventListener("focusout", this.focusOutHandler.bind(this));
    generate.addEventListener("change", this.selectHandler.bind(this));

    this.jsonViewer = generate;
    return generate;
  }

  private generate(object: any) {
    const container = NodeGen.createNode({
      nodeName: "div",
    });

    for (const [key, value] of Object.entries(object)) {
      const type = typeof value;
      const rowNode = NodeGen.createNode({
        nodeName: "div",
        classes: ["node"],
      });

      // key node
      const keyNode = NodeGen.createNode({
        nodeName: "div",
        content: key,
        classes: ["property"],
        dataProps: {
          "data-property": "",
        },
      });

      rowNode.append(keyNode);

      // value node
      const valueNodeOptions: any = {
        nodeName: "div",
        content: `${value}`,
        // classes: ["value"],
      };

      // not strict null check
      if (!value && type === "object") {
        valueNodeOptions.dataProps = { "data-type": "null" };
      } else if (Array.isArray(value)) {
        valueNodeOptions.dataProps = { "data-type": "array" };
      } else if (type === "object") {
        const nodes = this.generate(value);
        nodes.classList.add("hide");
        nodes.dataset.type = "object";

        rowNode.append(nodes);
        container.append(rowNode);
        continue;
      } else {
        valueNodeOptions.dataProps = { "data-type": type };
      }

      // valueNodeOptions.dataProps = {
      //   ...valueNodeOptions.dataProps,
      //   "data-value": "",
      // };
      const valueNode = NodeGen.createNode(valueNodeOptions);
      if (type !== "boolean") {
        valueNode.setAttribute("contenteditable", "true");
      }
      rowNode.append(valueNode);

      // push row node
      container.append(rowNode);
    }

    return container;
  }

  private getJsonOrError(json: any): void {
    try {
      const j = JSON.parse(json);
      // TODO remove this
      j.array = [1, 2, 3];
      j.boolean = false;
      j.null = null;

      return j;
    } catch (error: any) {
      throw Error(error);
    }
  }

  private focusOutHandler(e: Event) {
    const target = e.target as HTMLElement;
    if (target.tagName === "SELECT") return;

    const type = target.dataset.type;
    const tempValue = (target.textContent || "").trim();
    let newValue, newType;

    console.log("tempValue", tempValue);
    if (tempValue && type === "object") {
      newValue = strToObj(tempValue);
      if (newValue && typeof newValue === "object") {
        const nodes = this.generate(newValue);
        nodes.classList.add("hide");
        nodes.dataset.type = "object";
        target.replaceWith(nodes);
      } else {
        alert("input valid object");
        newValue = tempValue;
        newType = "string";
      }
    }
    // обрабатываем array
    else if (type === "array") {
      newValue = getArrayOrError(tempValue);
      newType = type;
    }
    // обрабатываем string, number
    else {
      newValue = getValueOrString(tempValue);
      newType = typeof newValue;
    }

    // обрабатываем null
    if (!newValue) {
      newValue = "null";
      newType = "null";
    }
    console.log("newValue", newValue);

    target.dataset.type = newType;
    target.textContent = newValue;
  }

  private selectHandler(e: Event) {
    const t = e.target as HTMLSelectElement;

    if (t.value === "delete") {
      this.target.remove();
    }
    if (t.value === "add") {
      const result = prompt("Input new value", "name: value");
      const newValue = result?.split(":");

      if (newValue) {
        const nodes = this.generate(Object.fromEntries([newValue]));
        this.target.after(nodes.children[0]);
      } else {
        alert("input valid value");
      }
    }

    const valueNode = this.target.querySelector("[data-type]");

    if (t.value !== "boolean") {
      valueNode.setAttribute("contenteditable", "true");
    } else {
      valueNode.removeAttribute("contenteditable");
    }

    if (t.value === "array") {
      const oldType = valueNode.dataset.type;

      if (oldType === "object") {
        const newNode = NodeGen.createNode({
          nodeName: "div",
          classes: ["node"],
          dataProps: { "data-type": "array" },
        });
        newNode.setAttribute("contenteditable", "true");

        valueNode.replaceWith(newNode);
        newNode.focus();
      } else {
        valueNode.dataset.type = "array";
      }
    }
    if (t.value === "object") {
      valueNode.dataset.type = "object";
      valueNode.focus();
    }
    if (t.value === "string") {
      // исключаем null, поскольку String(null) будет 'null', и мы хотим этого добиться
      if (valueNode.dataset.type === "object") {
        valueNode.textContent = getValueOrString(valueNode.textContent);
      }
      valueNode.dataset.type = "string";
    }
    if (t.value === "number") {
      valueNode.dataset.type = "number";
      const newValue = Number(getValueOrString(valueNode.textContent));
      valueNode.textContent = String(Number.isNaN(newValue) ? 0 : newValue);
    }
    if (t.value === "boolean") {
      valueNode.dataset.type = "boolean";
      valueNode.textContent = String(
        !!getValueOrString(valueNode.textContent || "")
      );
    }

    this.select.remove();
  }

  private clickHandler(e: Event) {
    const target = e.target as HTMLElement;
    // toggle node view
    if (target.dataset.type === "object") {
      target.classList.toggle("hide");
      return;
    }

    // обрабатываем boolean
    if (target.dataset.type === "boolean") {
      target.textContent = String(!getValueOrString(target.textContent || ""));
      return;
    }

    if (target.hasAttribute("data-property")) {
      const select = this.jsonViewer.querySelector("select");
      if (select) select.remove();
      const contextMenu = this.getContextMenu(e);
      this.target = this.getTargetNode(e);
      this.select = contextMenu;
      this.jsonViewer.append(contextMenu);
    }
  }

  // будем генерировать меню для каждого пункта, чтобы иметь возможность гибкой настройки
  private getContextMenu(
    e: Event,
    options: Array<SelectOption | SelectGroupOption> = [
      {
        name: "Выберите действие",
        value: "",
      },
      {
        label: "изменить тип",
        options: [
          {
            name: "array",
            value: "array",
          },
          {
            name: "object",
            value: "object",
          },
          {
            name: "number",
            value: "number",
          },
          {
            name: "string",
            value: "string",
          },
          {
            name: "boolean",
            value: "boolean",
          },
        ],
      },
      {
        name: "удалить",
        value: "delete",
      },
      {
        name: "добавить",
        value: "add",
      },
    ]
  ): HTMLElement {
    const menuNode = NodeGen.createNode({
      nodeName: "select",
    });

    // вынести
    const optionsNodes = options.map(
      (option: SelectOption | SelectGroupOption) => {
        if ("label" in option) {
          const group = NodeGen.createNode({
            nodeName: "optgroup",
          }) as HTMLOptGroupElement;
          group.label = option.label;

          const options = option.options.map((o: SelectOption) => {
            return NodeGen.createNode({
              nodeName: "option",
              content: o.name,
              value: o.value,
            });
          });

          group.append(...options);
          return group;
        }

        return NodeGen.createNode({
          nodeName: "option",
          content: option.name,
          value: option.value,
        });
      }
    );

    menuNode.append(...optionsNodes);

    // стили для позиционирования рядом с элементом
    setStyle(menuNode, e.target as HTMLElement);

    return menuNode;
  }

  public destroy(): void {
    this.jsonViewer.removeEventListener("click", this.clickHandler);
    this.jsonViewer.removeEventListener("focusout", this.focusOutHandler);
    this.jsonViewer.removeEventListener("change", this.selectHandler);
    this.jsonViewer.remove();
  }

  private getTargetNode(e: Event): Element | null {
    const t = e.target as HTMLDivElement;
    const targetNode = t.closest(".node");

    return targetNode;
  }
}

function getValueOrString(value: string) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

// todo: need deep
// non recursive
function strToObj(str: string) {
  const obj = {};
  if (str && typeof str === "string") {
    const objStr = str.match(/\{(.)+\}/g);
    eval("obj =" + objStr);
  }
  return obj;
}

function getArrayOrError(value: string) {
  try {
    if (value.startsWith("[") && value.endsWith("]")) {
      const sliced = value.slice(1, value.length - 1);
      return sliced;
    }
    const array = Array.from(value.split(","));
    return array.toString();
  } catch (error: any) {
    alert("array is not correct");
    return "";
  }
}

function setStyle(elem: HTMLElement, target: HTMLElement) {
  const coords = target.getBoundingClientRect();

  elem.style.position = "absolute";
  elem.style.left = coords.right + elem.offsetWidth + "px";
  elem.style.top = coords.top + "px";
  elem.style.zIndex = "2";
  elem.style.background = "white";
}

interface DataProps {
  [key: string]: string;
}

class NodeGen {
  static createNode(options: {
    nodeName: keyof HTMLElementTagNameMap;
    content?: string;
    classes?: string[];
    dataProps?: DataProps;
    value?: string;
  }) {
    const node = document.createElement(options.nodeName) as HTMLElement;
    if (options.content) {
      node.textContent = options.content;
    }
    if (options.classes) {
      node.classList.add(...options.classes);
    }
    if (options.value) {
      (node as any).value = options.value;
    }
    if (options.dataProps && Object.entries(options.dataProps).length) {
      for (const key in options.dataProps) {
        node.setAttribute(key, options.dataProps[key]);
      }
    }
    return node;
  }
}
