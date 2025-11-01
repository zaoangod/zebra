import {resolver} from './resolver.js'
import {CATCHER_FALLBACK} from './constant'
import {Wretch, WretchOption} from './type'
import {isArray, isObject, isString, mix} from './util'

export const core: Wretch = {
    _url: '',
    _configure: {},
    _catcher: new Map(),
    _resolver: [],
    _defer: [],
    _middleware: [],
    _addon: [],
    addon(addon: any) {
        const addons = Array.isArray(addon) ? addon : [addon]
        const wretchProps = addons.reduce((buffer, item) => ({...buffer, ...item.wretch}), {})
        return {...this, _addons: [...this._addons, ...addons], ...wretchProps}
    },
    url(url: string, replace = false) {
        if (replace) return {...this, _url: url}
        const index: number = this._url.indexOf('?')
        return {
            ...this,
            _url: index > -1 ?
                this._url.slice(0, index) + url + this._url.slice(index) :
                this._url + url
        }
    },
    configure(wretchOption: WretchOption, replace = false) {
        return {...this, _configure: replace ? wretchOption : mix(this._configure, wretchOption)}
    },
    header(headerValue) {
        const headers =
            !headerValue ? {} :
                Array.isArray(headerValue) ? Object.fromEntries(headerValue) :
                    'entries' in headerValue ? Object.fromEntries((headerValue as Headers).entries()) :
                        headerValue
        return {...this, _configure: mix(this._configure, {headers: headers})}
    },
    accept(value: string) {
        return this.header({'Accept': value})
    },
    content(value: string) {
        return this.header({'Content-Type': value})
    },
    authorization(value: string) {
        return this.header({Authorization: value})
    },
    catcher(identity, catcher) {
        const value = new Map(this._catcher)
        value.set(identity, catcher)
        return {...this, _catcher: value}
    },
    catcherFallback(catcher) {
        return this.catcher(CATCHER_FALLBACK, catcher)
    },
    customError(transformer) {
        return {...this, _errorTransformer: transformer} as any
    },
    resolve<R = unknown>(resolver, clear: boolean = false) {
        return {...this, _resolver: clear ? [resolver] : [...this._resolver, resolver]}
    },
    defer(callback, clear: boolean = false) {
        return {
            ...this,
            _defer: clear ? [callback] : [...this._defer, callback]
        }
    },
    middleware(middleware, clear = false) {
        return {
            ...this,
            _middlewares: clear ? middleware : [...this._middleware, ...middleware]
        }
    },
    body(content) {
        return {...this, _configure: {...this._configure, body: content}}
    },
    json(value: string | object | any[]) {
        if (isObject(value) || isArray(value)) {
            return this.content('application/json').body(JSON.stringify(value))
        }
        throw new Error('value is not an object or array')
    },
    form(value: string | object) {
        const encodeQueryValue = (key: string, value: unknown): string => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(
                typeof value === 'object' ? JSON.stringify(value) : `${value}`
            )
        }
        const convertFormUrl = (data: object): string => {
            return Object.keys(data).map(key => {
                const value: any = data[key]
                if (value instanceof Array) {
                    return value.map(v => encodeQueryValue(key, v)).join('&')
                }
                return encodeQueryValue(key, value)
            }).join('&')
        }
        if (isObject(value) || isString(value)) {
            return this.content('application/x-www-form-urlencoded').body(typeof value === 'string' ? value : convertFormUrl(value))
        }
        throw new Error('value is not an object or string')
    },
    toFetch() {
        return (fetchUrl: string, fetchOptions: WretchOption = {}) => {
            return this
                .url(fetchUrl)
                .configure(fetchOptions)
                .catcherFallback(error => error.response)
                .fetch()
                .response()
        }
    },
    fetch(method: string = this._configure.method, url = '') {
        let base = this.url(url).configure({method: method})
        return resolver(
            base._defer.reduce((buffer: Wretch, item) => {
                return item(buffer, buffer._url, buffer._configure)
            }, base)
        )
    },
    put(url: string = '') {
        return this.fetch('PUT', url)
    },
    get(url: string = '') {
        return this.fetch('GET', url)
    },
    head(url: string = '') {
        return this.fetch('HEAD', url)
    },
    post(url: string = '') {
        return this.fetch('POST', url)
    },
    patch(url: string = '') {
        return this.fetch('PATCH', url)
    },
    delete(url: string = '') {
        return this.fetch('DELETE', url)
    },
    option(url: string = '') {
        return this.fetch('OPTIONS', url)
    }
}