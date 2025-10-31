import {core} from './core.js'
import {WretchError} from './resolver.js'
import type {Wretch, WretchOption} from './type'

export type {
    Wretch,
    ConfiguredMiddleware,
    FetchLike,
    Middleware,
    WretchResponseChain,
    WretchOption,
    WretchError,
    WretchErrorCallback,
    WretchResponse,
    WretchDeferredCallback,
    WretchAddon
} from './type'

/**
 * Creates a new wretch instance with a base url and base
 * [fetch options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
 *
 * ```ts
 * import wretch from "wretch"
 *
 * // Reusable instance
 * const w = wretch("https://domain.com", { mode: "cors" })
 * ```
 *
 * @param _url The base url
 * @param _options The base fetch options
 * @returns A fresh wretch instance
 */
const factory = (_url = '', _options: WretchOption = {}): Wretch =>
    ({...core, _url, _option: _options})

factory['default'] = factory
factory.WretchError = WretchError

export default factory