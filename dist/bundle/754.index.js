import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
export const id = 754;
export const ids = [754];
export const modules = {

/***/ 9754:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var keytar = __webpack_require__(3856)

function checkRequired(val, name) {
  if (!val || val.length <= 0) {
    throw new Error(name + ' is required.');
  }
}

module.exports = {
  getPassword: function (service, account) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')

    return keytar.getPassword(service, account)
  },

  setPassword: function (service, account, password) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')
    checkRequired(password, 'Password')

    return keytar.setPassword(service, account, password)
  },

  deletePassword: function (service, account) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')

    return keytar.deletePassword(service, account)
  },

  findPassword: function (service) {
    checkRequired(service, 'Service')

    return keytar.findPassword(service)
  },

  findCredentials: function (service) {
    checkRequired(service, 'Service')

    return keytar.findCredentials(service)
  }
}


/***/ }),

/***/ 3856:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)(__webpack_require__.ab + "build/Release/keytar.node")

/***/ })

};
