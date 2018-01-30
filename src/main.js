import I18n from './libs/i18n'
import './libs/listen'
import './libs/actions'

import App from './panel/app'

import Scene from './adapters/scene'

import Autocomplete from './adapters/autocomplete'


new I18n()
new Scene()

new Autocomplete('#search')
new App('panels')


