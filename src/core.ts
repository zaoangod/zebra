import {resolver} from './resolver.js'
import {Wretch, WretchOption} from './type'
import {CATCHER_FALLBACK} from './constant'
import {extractContentType, isLikelyJsonMime, mix} from './util'

export const core: Wretch = {
    _url: '',
    _option: {},
    _catcher: new Map(),
    _resolver: [],
    _defer: [],
    _middleware: [],
    _addons: [],
    addon(addon) {
        const addons = Array.isArray(addon) ? addon : [addon]
        const wretchProps = addons.reduce((buffer, item) => ({...buffer, ...item.wretch}), {})
        return {...this, _addons: [...this._addons, ...addons], ...wretchProps}
    },
    url(u: string, replace = false) {
        if (replace) {
            return {...this, _url: u}
        }
        const index: number = this._url.indexOf('?')
        return {
            ...this,
            _url: index > -1 ?
                this._url.slice(0, index) + u + this._url.slice(index) :
                this._url + u
        }
    },
    option(option: WretchOption, replace = false) {
        return {...this, _option: replace ? option : mix(this._option, option)}
    },
    header(headerValue) {
        const headers =
            !headerValue ? {} :
                Array.isArray(headerValue) ? Object.fromEntries(headerValue) :
                    'entries' in headerValue ? Object.fromEntries((headerValue as Headers).entries()) :
                        headerValue
        return {...this, _option: mix(this._option, {headers: headers})}
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
    fetch(method: string = this._option.method, url = '', body = null) {
        let base = this.url(url).option({method: method})
        // "Jsonify" the body if it is an object and if it is likely that the content type targets json.
        const contentType = extractContentType(base._option.headers)
        const jsonify =
            typeof body === 'object' &&
            !(body instanceof FormData) &&
            (!base._option.headers || !contentType || isLikelyJsonMime(contentType))
        base =
            !body ? base :
                jsonify ? base.json(body, contentType) :
                    base.body(body)
        return resolver(
            base
                ._defer
                .reduce((acc: Wretch, curr) => curr(acc, acc._url, acc._option), base)
        )
    },
    get(url: string = '') {
        return this.fetch('GET', url)
    },
    delete(url: string = '') {
        return this.fetch('DELETE', url)
    },
    put(body, url: string = '') {
        return this.fetch('PUT', url, body)
    },
    post(body, url: string = '') {
        return this.fetch('POST', url, body)
    },
    patch(body, url: string = '') {
        return this.fetch('PATCH', url, body)
    },
    head(url: string = '') {
        return this.fetch('HEAD', url)
    },
    opts(url: string = '') {
        return this.fetch('OPTIONS', url)
    },
    body(contents) {
        return {...this, _option: {...this._option, body: contents}}
    },
    json(value: object) {
        return this.content('application/json').body(JSON.stringify(value))
    },
    toFetch() {
        return (fetchUrl, fetchOptions: WretchOption = {}) => {
            return this
                .url(fetchUrl)
                .option(fetchOptions)
                .catcherFallback(error => error.response)
                .fetch()
                .response()
        }
    }
}