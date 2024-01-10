const {
  newKeyMap,
  KEYMAP_CONTAINER_COL_LEN,
  loadData,
  writeData,
  reloadRendererOnCall,
} = window.electron;

let keyMapItems = [];  // Array of key map items

// modal for adding or editing key map item.
const modal = {
  instance: new bootstrap.Modal(document.querySelector("#modal")),
  inputDetectBtn: null, // button for start detecting trigger key.
  outputDetectBtn: null, // button for start detecting action key and modifier keys.
  selectedDetectBtn: null,
  selectedRowIdx: null, // index of selected key map item in key map item list. supposed to be identical with index of keyMapItems.
  targetAppInput: null,
  outputActionInput: null,

  keyMapInput: newKeyMap(), // not yet saved and currently editing key map item in modal.

  init: function () {
    const pressText = "Press"; // text for displaying when clicking detect button.
    this.inputDetectBtn =
      this.instance._element.querySelector("#input-detect-btn");
    this.outputDetectBtn =
      this.instance._element.querySelector("#output-detect-btn");

    this.inputDetectBtn.addEventListener("click", () => {
      const activated = this.inputDetectBtn.classList.toggle("active");
      if (activated) {
        this.selectedDetectBtn = this.inputDetectBtn;
        this.setKeyMapInput(
          this.selectedDetectBtn,
          null,
          pressText,
          this.keyMapInput.targetApp
        );
        this.outputDetectBtn.classList.toggle("active", false);
      } else {
        this.selectedDetectBtn = null;
      }
    });

    this.outputDetectBtn.addEventListener("click", () => {
      const activated = this.outputDetectBtn.classList.toggle("active");
      if (activated) {
        this.selectedDetectBtn = this.outputDetectBtn;
        this.keyMapInput.map.init();
        this.setKeyMapInput(this.selectedDetectBtn, null, pressText);
        this.inputDetectBtn.classList.toggle("active", false);
      } else {
        this.selectedDetectBtn = null;
      }
    });

    this.targetAppInput = this.instance._element.querySelector("#target-app");
    this.targetAppInput.addEventListener("change", () => {
      this.keyMapInput.targetApp = this.targetAppInput.value;
    });

    this.outputActionInput = this.instance._element.querySelector(
      "#output-action-select"
    );
    this.outputActionInput.addEventListener("change", () => {
      const decimal = parseInt(this.outputActionInput.value);
      const textContent =
        this.outputActionInput.options[this.outputActionInput.selectedIndex]
          .textContent;

      this.keyMapInput.map.init();
      this.setKeyMapInput(this.outputDetectBtn, decimal, textContent);

      this.outputDetectBtn.classList.toggle("active", false);
      this.selectedDetectBtn = null;
    });

    const keyDownHandlerBound = this.keyDownHandler.bind(this);
    // const keyUpHandlerBound = this.keyUpHandler.bind(this);
    this.instance._element.addEventListener("show.bs.modal", () => {
      const existAlert = document.querySelector(".alert");
      existAlert?.remove();
      this.instance._element.addEventListener("keydown", keyDownHandlerBound);
      // this.instance._element.addEventListener("keyup", keyUpHandlerBound);
      this.reload();
    });

    this.instance._element.addEventListener("hide.bs.modal", () => {
      reloadContainer();
      writeData(getJsonString());
    });

    this.instance._element.addEventListener("hidden.bs.modal", () => {
      // reset key map input of modal and selected detect button.
      this.keyMapInput = newKeyMap();
      this.selectedDetectBtn = null;
      this.reload();

      this.instance._element.removeEventListener(
        "keydown",
        keyDownHandlerBound
      );
      // this.instance._element.removeEventListener("keyup", keyUpHandlerBound);
    });

    // save key map item when save button is clicked.
    this.instance._element
      .querySelector("#save-btn")
      .addEventListener("click", () => {
        // return if key mapping is invalid.
        if (!this.isKeyMapExists()) {
          const modifierKeys = this.keyMapInput.map.modifierKeys;
          if (
            modifierKeys.ctrl ||
            modifierKeys.shift ||
            modifierKeys.alt ||
            modifierKeys.win
          ) {
            this.showAlert("Action key cannot be set with only modifier keys.");
            return;
          }

          this.showAlert("Invalid key mapping.");
          return;
        }

        // return if key already exists
        for (let x in keyMapItems) {
          if (Number(x) === this.selectedRowIdx) continue;
          if (
            keyMapItems[x].keyCode === this.keyMapInput.keyCode &&
            keyMapItems[x].targetApp === this.keyMapInput.targetApp
          ) {
            this.showAlert("Trigger key already exists.");
            return;
          }
        }

        // process if key mapping is valid.
        keyMapItems[this.selectedRowIdx] = this.keyMapInput; // set corresponding key map item to key map input of modal.
        this.keyMapInput = newKeyMap(); // reset key map input of modal.
        this.instance.toggle(); // hide modal.
      });

    // delete key map item when delete button is clicked.
    this.instance._element
      .querySelector("#delete-btn")
      .addEventListener("click", () => {
        keyMapItems.splice(this.selectedRowIdx, 1); // remove corresponding key map item.
        this.instance.toggle(); // hide modal.
      });
  },

  reload: function () {
    const addKbdElement = (displayKey, container) => {
      if (!displayKey || !container) return;
      const kbd = document.createElement("kbd");
      kbd.className = "kbc-button px-3";
      kbd.innerText = displayKey;
      container.appendChild(kbd);
    };

    const noneText = "None";
    const inputKbdContainer = this.instance._element.querySelector(
      "#input-kbd-container"
    );
    const outputKbdContainer = this.instance._element.querySelector(
      "#output-kbd-container"
    );

    inputKbdContainer.innerHTML = outputKbdContainer.innerHTML = "";
    addKbdElement(this.keyMapInput.displayKey, inputKbdContainer);
    this.keyMapInput.map.modifierKeys.ctrl &&
      addKbdElement("Ctrl", outputKbdContainer);
    this.keyMapInput.map.modifierKeys.shift &&
      addKbdElement("Shift", outputKbdContainer);
    this.keyMapInput.map.modifierKeys.alt &&
      addKbdElement("Alt", outputKbdContainer);
    this.keyMapInput.map.modifierKeys.win &&
      addKbdElement("Win", outputKbdContainer);
    addKbdElement(this.keyMapInput.map.displayKey, outputKbdContainer);

    inputKbdContainer.innerHTML || addKbdElement(noneText, inputKbdContainer);
    outputKbdContainer.innerHTML || addKbdElement(noneText, outputKbdContainer);

    this.targetAppInput.value = this.keyMapInput.targetApp || "";
  },

  setKeyMapInput: function (target, keyCode, displayKey, targetApp = null) {
    let keyMapInputElem = this.keyMapInput;
    target === this.outputDetectBtn && (keyMapInputElem = keyMapInputElem.map);
    keyMapInputElem.keyCode = keyCode;
    keyMapInputElem.displayKey = displayKey;
    target === this.inputDetectBtn && (keyMapInputElem.targetApp = targetApp);
    this.reload();
  },

  isKeyMapExists: function () {
    return this.keyMapInput.keyCode && this.keyMapInput.map.keyCode;
  },

  showAlert: function (message, alertTypeClass = "alert-danger") {
    const showDuration = 1.5;
    const fadeDuration = 0.5;

    const alertContainer =
      this.instance._element.querySelector("#alert-container");
    const existAlert = alertContainer.querySelector(".alert");
    existAlert?.remove();
    const alert = document.createElement("div");
    alert.className = "alert my-auto";
    alert.classList.add(alertTypeClass);
    alert.style.textAlign = "center";
    alert.style.maxWidth = "15em";
    alert.style.fontSize = "0.75em";
    alert.style.padding = "5px 5px";
    alert.style.transition = `opacity ${fadeDuration}s`;
    alert.innerText = message;
    alertContainer.appendChild(alert);

    setTimeout(function () {
      alert.style.opacity = "0";
      setTimeout(function () {
        alert.classList.add("d-none");
      }, fadeDuration * 1000);
    }, showDuration * 1000);
  },

  keyDownHandler: function (event) {
    if (!this.selectedDetectBtn) return;
    event.preventDefault();

    const modifierKeys = {
      CONTROL: 0x11,
      LCONTROL: 0xa2,
      RCONTROL: 0xa3,
      SHIFT: 0x10,
      LSHIFT: 0xa0,
      RSHIFT: 0xa1,
      MENU: 0x12,
      LMENU: 0xa4,
      RMENU: 0xa5,
      LWIN: 0x5b,
      RWIN: 0x5c,
    };
    const spaceDisplayKey = "Space";

    let key = event.key;
    key.length === 1 && (key = key.toUpperCase());
    key === " " && (key = spaceDisplayKey);

    if (this.selectedDetectBtn === this.inputDetectBtn) {
      // return if modifier key
      if (Object.values(modifierKeys).includes(event.keyCode)) {
        this.showAlert("Modifier key is not allowed for trigger keys.");
        return;
      }

      // return if key is space or semicolon or tab
      if (key === spaceDisplayKey || key === ";" || key === "Tab") {
        if (this.selectedDetectBtn === this.inputDetectBtn) {
          this.showAlert(`'${key}' for trigger key is not allowed.`);
          return;
        }
      }
    } else if (this.selectedDetectBtn === this.outputDetectBtn) {
      if (this.keyMapInput.map.keyCode || this.keyMapInput.map.displayKey) {
        this.keyMapInput.map.init();
        this.reload();
      }
      // set and return if key is modifier key
      if (Object.values(modifierKeys).includes(event.keyCode)) {
        switch (event.keyCode) {
          case modifierKeys.CONTROL:
          case modifierKeys.LCONTROL:
          case modifierKeys.RCONTROL:
            this.keyMapInput.map.modifierKeys.ctrl = true;
            break;
          case modifierKeys.SHIFT:
          case modifierKeys.LSHIFT:
          case modifierKeys.RSHIFT:
            this.keyMapInput.map.modifierKeys.shift = true;
            break;
          case modifierKeys.MENU:
          case modifierKeys.LMENU:
          case modifierKeys.RMENU:
            this.keyMapInput.map.modifierKeys.alt = true;
            break;
          case modifierKeys.LWIN:
          case modifierKeys.RWIN:
            this.keyMapInput.map.modifierKeys.win = true;
            break;
        }

        this.reload();
        return;
      }
    }

    this.setKeyMapInput(
      this.selectedDetectBtn,
      event.keyCode,
      key,
      this.keyMapInput.targetApp
    );

    this.selectedDetectBtn.classList.toggle("active", false);
    this.selectedDetectBtn = null;
  },
};

async function loadDataWrapper() {
  keyMapItems = [];
  const parsedData = await loadData();
  for (const keyMap of parsedData.keyMaps) {
    keyMapItems.push(keyMap);
  }
  setTheme(parsedData.theme);
  document.querySelector("#activate-delay").value = parseInt(parsedData.activateDelay);
  reloadContainer();
}

function getJsonString() {
  const exportData = {
    theme: document.body.getAttribute("data-bs-theme"),
    activateDelay: parseInt(document.querySelector("#activate-delay").value),
    keyMaps: keyMapItems.map((keyMapItem) => {
      return {
        keyCode: keyMapItem.keyCode,
        displayKey: keyMapItem.displayKey,
        targetApp: keyMapItem.targetApp,
        map: {
          keyCode: keyMapItem.map.keyCode,
          displayKey: keyMapItem.map.displayKey,
          modifierKeys: {
            ctrl: keyMapItem.map.modifierKeys.ctrl,
            shift: keyMapItem.map.modifierKeys.shift,
            alt: keyMapItem.map.modifierKeys.alt,
            win: keyMapItem.map.modifierKeys.win,
          },
        },
      };
    }),
  };

  return JSON.stringify(exportData, null, 2);
}

function reloadContainer() {
  const ButtonType = {
    Add: 0,
    Edit: 1,
  };
  const itemContainer = document.querySelector("#item-container");

  function createButton(rowButtonType) {
    let btn = document.createElement("button");
    btn.style.padding = "2px 7px";
    let icon = document.createElement("i");
    btn.appendChild(icon);

    btn.addEventListener("click", (event) => {
      const currRow = event.target.closest(".row");
      modal.selectedRowIdx = Array.from(
        itemContainer.querySelectorAll(".keymap-item")
      ).indexOf(currRow);
    });

    switch (rowButtonType) {
      case ButtonType.Add:
        btn.className = "btn icon-size-30";
        icon.className = "bi bi-plus-circle";
        btn.addEventListener("click", () => {
          modal.instance.toggle();
        });
        break;

      case ButtonType.Edit:
        btn.className = "btn";
        icon.className = "bi bi-pencil icon-size-24";
        btn.addEventListener("click", () => {
          const currKeyMapItem = keyMapItems[modal.selectedRowIdx];
          modal.setKeyMapInput(
            modal.inputDetectBtn,
            currKeyMapItem.keyCode,
            currKeyMapItem.displayKey,
            currKeyMapItem.targetApp
          );
          modal.setKeyMapInput(
            modal.outputDetectBtn,
            currKeyMapItem.map.keyCode,
            currKeyMapItem.map.displayKey
          );
          modal.keyMapInput.map.modifierKeys = currKeyMapItem.map.modifierKeys;
          modal.instance.toggle();
        });
        break;
    }

    return btn;
  }

  function createItem(keyMapItem, buttonType) {
    const addKbdElement = (displayKey, container) => {
      if (!displayKey || !container) return;
      const kbd = document.createElement("kbd");
      kbd.className = "kbc-button px-3";
      kbd.innerText = displayKey;
      container.appendChild(kbd);
    };

    const row = document.createElement("div");
    row.className = "row keymap-item justify-content-center border-top";
    row.style.minHeight = "70px";

    for (let i = 0; i < KEYMAP_CONTAINER_COL_LEN; i++) {
      const col = document.createElement("div");
      col.className =
        "d-flex justify-content-center align-items-center flex-wrap";
      const icon = document.createElement("i");
      icon.className = "bi bi-arrow-right-short icon-size-48";

      switch (i) {
        case 0:
          col.classList.add("col-2");
          if (keyMapItem) {
            col.innerText = keyMapItem.targetApp;
            keyMapItem.targetApp === "" && (col.innerText = "Global");
          }
          break;
        case 1:
          col.classList.add("col-2");
          addKbdElement(keyMapItem?.displayKey, col);
          break;
        case 2:
          col.classList.add("col-1");
          keyMapItem && keyMapItem?.map && col.appendChild(icon);
          break;
        case 3:
          col.classList.add("col-4");
          keyMapItem?.map?.modifierKeys.ctrl && addKbdElement("Ctrl", col);
          keyMapItem?.map?.modifierKeys.shift && addKbdElement("Shift", col);
          keyMapItem?.map?.modifierKeys?.alt && addKbdElement("Alt", col);
          keyMapItem?.map?.modifierKeys?.win && addKbdElement("Win", col);
          addKbdElement(
            keyMapItem?.map?.displayKey,
            col,
            col.children.length > 0
          );
          if (col.children.length >= 3) {
            Array.from(col.children).forEach((kbd) => {
              kbd.classList.add("kbc-button-sm");
            });
          }
          break;
        case 4:
          col.classList.add("col-1");
          const btn = createButton(buttonType);
          col.appendChild(btn);
          break;
      }
      row.appendChild(col);
    }
    return row;
  }

  itemContainer.innerHTML = "";
  keyMapItems.forEach((keyMapItem) => {
    itemContainer.appendChild(createItem(keyMapItem, ButtonType.Edit));
  });
  itemContainer.appendChild(createItem(null, ButtonType.Add));
}

function setTheme(themeName) {
  document.body.setAttribute("data-bs-theme", themeName);
  document.querySelector("#theme-switch").checked = themeName === "dark";
}

loadDataWrapper();
reloadRendererOnCall(loadDataWrapper);
modal.init();

document.querySelector("#import-file").addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    console.log(file);
    const reader = new FileReader();
    reader.onload = function (e) {
      const jsonString = e.target.result;
      writeData(jsonString);
    };

    reader.readAsText(file);
  }

  this.value = "";
});

document.querySelector("#btn-import-file").addEventListener("click", () => {
  document.querySelector("#import-file").click();
});

document.querySelector("#export-file").addEventListener("click", () => {
  const jsonString = getJsonString();
  const blob = new Blob([jsonString], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  const fileName = "config.sfn";
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  downloadLink.click();

  URL.revokeObjectURL(blobUrl);
});

document.querySelector("#github-btn").addEventListener("click", () => {
  window.open("https://github.com/wuutae/spacefn");
});

document.querySelector("#theme-switch").addEventListener("change", function () {
  const themeSwitchIcon = document.querySelector("#theme-switch-icon");
  const dayIcon = "bi-brightness-high-fill";
  const nightIcon = "bi-moon-fill";
  const attrValue = this.checked ? "dark" : "light";

  themeSwitchIcon.classList.toggle(dayIcon, !this.checked);
  themeSwitchIcon.classList.toggle(nightIcon, this.checked);

  setTheme(attrValue);
  writeData(getJsonString());
});

document
  .querySelector("#theme-switch-icon")
  .addEventListener("click", function () {
    document.querySelector("#theme-switch").click();
  });

document
  .querySelector("#activate-delay")
  .addEventListener("change", () => {
    writeData(getJsonString());
  });
