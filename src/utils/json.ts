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
  public init(json: string): HTMLElement {
    const generate = this.generate(json);

    generate.addEventListener("click", this.clickHandler.bind(this));
    // поскольку blur не всплывает, используем focusout
    generate.addEventListener("focusout", this.focusOutHandler.bind(this));
    generate.addEventListener("change", this.selectHandler.bind(this));

    this.jsonViewer = generate;
    return generate;
  }

  private generate(object: string): HTMLElement {
    const container = NodeGen.createNode({
      nodeName: "div",
    });

    for (const [key, value] of Object.entries(object)) {
      const type = getTypeOfValue(value);
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
      const valueNodeOptions: createNodeOptions = {
        nodeName: "div",
        content: `${value}`,
        // classes: ["value"],
      };

      // not strict null check
      if (type === "null") {
        valueNodeOptions.dataProps = { "data-type": "null" };
      } else if (type === "array") {
        valueNodeOptions.content = `[${value}]`;
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

  private focusOutHandler(e: FocusEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === "SELECT") return;

    const tempValue = target.textContent || "";
    // пустую строку приводим к null
    let newValue = tempValue !== "" ? getValueOrInput(tempValue) : null;
    const newType = getTypeOfValue(newValue);

    if (newType === "boolean") {
      target.removeAttribute("contenteditable");
    }

    if (newType === "object") {
      const nodes = this.generate(newValue);
      nodes.classList.add("hide");
      nodes.dataset.type = "object";
      target.replaceWith(nodes);
      return;
    }
    // обрабатываем array
    else if (newType === "array") {
      newValue = JSON.stringify(getValueOrInput(tempValue));
    }

    // обрабатываем null
    if (newType === "null") {
      newValue = "null";
    }

    target.dataset.type = newType;
    target.textContent = newValue;
  }

  private selectHandler(e: Event) {
    const target = e.target as HTMLSelectElement;
    const valueNode = this.target.querySelector(
      "[data-type]"
    ) as HTMLDivElement;
    const oldType = valueNode.dataset.type;

    if (oldType === "boolean") {
      valueNode.setAttribute("contenteditable", "true");
    }

    if (target.value === "delete") {
      this.target.remove();
    }
    if (target.value === "change") {
      if (oldType === "object") {
        const newNode = NodeGen.createNode({
          nodeName: "div",
          dataProps: { "data-type": "string" },
          content: "input value",
        });
        newNode.setAttribute("contenteditable", "true");
        valueNode.replaceWith(newNode);
        newNode.focus();
      }

      valueNode.dataset.type = "string";
      valueNode.focus();
    }
    if (target.value === "add") {
      const result = prompt("Input new value", "name: value");
      const newValue = result?.split(":");

      if (newValue) {
        const nodes = this.generate(Object.fromEntries([newValue]));
        this.target.after(nodes.children[0]);
      } else {
        alert("input valid value");
      }
    }

    this.select.remove();
  }

  private clickHandler(e: Event) {
    const target = e.target as HTMLElement;
    // переключение видимости обьекта (свернуть/развернуть)
    if (target.dataset.type === "object") {
      target.classList.toggle("hide");
      return;
    }

    // обрабатываем boolean
    if (target.dataset.type === "boolean") {
      if (target.textContent) {
        target.textContent = String(!getValueOrInput(target.textContent));
      }
      return;
    }

    // Показать контекстное меню
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
        name: "изменить",
        value: "change",
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

// Поскольку мы принимает от пользователя данные в виде строки, приводим эту строку к валидному JSON
export function stringToJson(str: string): string {
  // ищем все строки, могут начинаться с ' или "
  const result = str.replace(/[a-z"'/]+/gim, (str: string) => {
    // если строка начинается с " или включает false / true / null, возвращаем как есть
    if (str.startsWith('"') || ["false", "true", "null"].includes(str)) {
      return str;
    }
    // если строка начинается с ', например 'sdf' заменяем кавычки на корректные для json
    else if (str.startsWith("'")) {
      return `"${str.slice(1, -1)}"`;
    }
    // все остальные строки оборачиваем в ""
    return `"${str}"`;
  });

  return result;
}

function getValueOrInput(value: string) {
  try {
    return JSON.parse(stringToJson(value));
  } catch (error) {
    return value;
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

// тут мы реально можем принимать любое значение
export function getTypeOfValue(value: any): string {
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "string") {
    return "string";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "object") {
    return "object";
  }
  // ts fallback remove if use js
  return "";
}

interface DataProps {
  [key: string]: string;
}

interface createNodeOptions {
  nodeName: keyof HTMLElementTagNameMap;
  content?: string;
  classes?: string[];
  dataProps?: DataProps;
  value?: string;
}

class NodeGen {
  static createNode(options: createNodeOptions) {
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
