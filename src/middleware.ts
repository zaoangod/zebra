import type {ConfiguredMiddleware, FetchLike} from './type'

/** @private @internal */
export const middlewareHelper = (middlewares: ConfiguredMiddleware[]) => (fetchFunction: FetchLike): FetchLike =>
    middlewares.reduceRight((buffer, item) => item(buffer), fetchFunction)