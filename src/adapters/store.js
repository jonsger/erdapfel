import nconf from '@qwant/nconf-getter'
import Error from '../adapters/error'
import {version} from '../../config/constants.yml'
import ExtendedString from "../libs/string";
import LocalStore from "../libs/local_store"
import MasqStore from "../libs/masq"

export default class Store {

  constructor() {
    // get store from window if already initialized
    if (window.__store) {
      return window.__store
    }
    // if store not initialized, use this
    window.__store = this

    // define an eventTarget
    this.eventTarget = document.createElement('store')

    // init stores
    this.localStore = new LocalStore()
    this.abstractStore = this.localStore
    this.masqConfig = nconf.get().masq
    this.initialized = true
    if (this.masqConfig.enabled) {
      this.masqEventTarget = document.createElement('masqStore')

      this.masqStore = new MasqStore(this.masqConfig)

      this.initPromise = this.init()
      this.initialized = false
    }
    // use abstract store for each operation that
    // should use masqStore when logged in and localStore when not logged in

    return this
  }

  async init() {
    const isLoggedIn = await this.masqStore.isLoggedIn()
    if (isLoggedIn) {
      this.abstractStore = this.masqStore
    }
    this.initialized = true
  }

  async checkInit() {
    if (!this.initialized) {
      await this.initPromise
    }
  }

  onToggleStore(cb) {
    if (this.masqConfig.enabled) {
      this.masqEventTarget.addEventListener('store_logged_in', cb)
      this.masqEventTarget.addEventListener('store_logged_out', cb)
    }
  }

  async login() {
    await this.checkInit()
    if (!this.masqConfig.enabled) {
      Error.sendOnce('store', 'login', 'error trying to login with disabled Masq', e)
      return
    }

    try {
      const loginParams = {
        endpoint: this.masqConfig.endpoint,
        url: window.location.origin + window.location.pathname,
        title: this.masqConfig.title,
        desc: this.masqConfig.desc,
        icon: this.masqConfig.icon
      }

      await this.masqStore.login(loginParams)
    } catch (e) {
      Error.sendOnce('store', 'login', 'error logging in', e)
      throw e
    }

    // login was successful, use masqStore as abstractStore until logout
    this.abstractStore = this.masqStore
    this.masqEventTarget.dispatchEvent(new Event('store_logged_in'))
  }

  async logout() {
    await this.checkInit()
    if (!this.masqConfig.enabled) {
      Error.sendOnce('store', 'logout', 'error trying to logout with disabled Masq', e)
      return
    }

    try {
      await this.masqStore.logout()
    } catch (e) {
      Error.sendOnce('store', 'logout', 'error logging out', e)
      throw e
    }
    this.abstractStore = this.localStore
    this.masqEventTarget.dispatchEvent(new Event('store_logged_out'))
  }

  async isLoggedIn() {
    await this.checkInit()
    if (!this.masqConfig.enabled) {
      return false
    }

    try {
      return await this.masqStore.isLoggedIn()
    } catch (e) {
      Error.sendOnce('store', 'isLoggedIn', 'error checking if logged in with masq', e)
      throw e
    }
  }

  async getUserInfo() {
    await this.checkInit()
    try {
      return await this.masqStore.getUserInfo()
    } catch (e) {
      Error.sendOnce('store', 'getUserInfo', 'error getting user info from masq', e)
      throw e
    }
  }

  async getAllPois() {
    await this.checkInit()
    try {
      return await this.abstractStore.getAllPois()
    } catch (e) {
      Error.sendOnce('store', 'getAllPois', 'error getting pois from ' + this.abstractStore.storeName, e)
      return []
    }
  }

  async getLastLocation() {
    await this.checkInit()
    try {
      return await this.abstractStore.get(`qmaps_v${version}_last_location`)
    } catch (e) {
      Error.sendOnce('store', 'getLastLocation', 'error getting last location from ' + this.abstractStore.storeName, e)
      return null
    }
  }

  async setLastLocation(loc) {
    await this.checkInit()
    try {
      return await this.abstractStore.set(`qmaps_v${version}_last_location`, loc)
    } catch (e) {
      Error.sendOnce('store', 'setLastLocation', 'error setting location in ' + this.abstractStore.storeName, e)
      throw e
    }
  }

  async getPrefixes(prefix) {
    await this.checkInit()
    const storedItems = await this.abstractStore.getAllPois()
    return storedItems.filter((storedItem) => {
      return ExtendedString.compareIgnoreCase(storedItem.name, prefix) === 0 /* start with */
    })
  }

  async has(poi) {
    await this.checkInit()
    try {
      return await this.abstractStore.has(poi.getKey())
    } catch (e) {
      Error.sendOnce('store', 'has', 'error checking existing key in ' + this.abstractStore.storeName, e)
    }
  }

  async add(poi) {
    await this.checkInit()
    try {
      await this.abstractStore.set(poi.getKey(), poi.poiStoreLiteral())
      this.eventTarget.dispatchEvent(new Event('poi_added'))
    } catch(e) {
      Error.sendOnce('store', 'add', 'error adding poi in ' + this.abstractStore.storeName, e)
    }
  }

  async del(poi) {
    await this.checkInit()
    try {
      await this.abstractStore.del(poi.getKey())
    } catch(e) {
      Error.sendOnce('store', 'del', 'error deleting key from ' + this.abstractStore.storeName, e)
    }
  }

  async clear() {
    await this.checkInit()
    try {
      await this.abstractStore.clear()
    } catch(e) {
      Error.sendOnce('store', 'clear', 'error clearing ' + this.abstractStore.storeName, e)
    }
  }
}
